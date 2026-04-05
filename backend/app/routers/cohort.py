from fastapi import APIRouter, status
from typing import List

from ..models import Cohort, Course
from ..schemas import CohortCreateSchema, CohortUpdateSchema, CohortResponseSchema, CohortWithRelationsSchema, EducationPlanSchema

router = APIRouter(prefix="/cohort", tags=["cohort"])


@router.post("", response_model=CohortResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_cohort(cohort: CohortCreateSchema):
    """Создать новый поток по учебному году"""
    return await Cohort.create_node(cohort.model_dump())


@router.get("", response_model=List[CohortResponseSchema])
async def get_cohorts(skip: int = 0, limit: int = 100):
    """Получить список всех потоков по учебным годам"""
    return await Cohort.get_list(skip=skip, limit=limit, relations=['program', 'director', 'manager'])


@router.get("/{cohort_id}", response_model=CohortWithRelationsSchema)
async def get_cohort(cohort_id: int):
    """Получить поток по учебному году по ID"""
    return await Cohort.get_by_id(cohort_id, relations=['program.faculty', 'director', 'manager', 'specializations', 'groups'])


@router.put("/{cohort_id}", response_model=CohortResponseSchema)
async def update_cohort(cohort_id: int, cohort_update: CohortUpdateSchema):
    """Обновить данные потока по учебному году"""
    cohort = await Cohort.update_node(cohort_id, cohort_update.model_dump(exclude_unset=True))
    await cohort.load_relations('program', 'director', 'manager')
    return cohort


@router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cohort(cohort_id: int):
    """Удалить поток по учебному году"""
    await Cohort.delete_by_id(cohort_id)


@router.get("/{cohort_id}/graph", response_model=EducationPlanSchema)
async def get_cohort_education_plan_graph(cohort_id: int):
    """Получить граф учебного плана потока по учебному году"""
    cohort = await Cohort.get_by_id(cohort_id, relations=['courses.prerequisites'])
    education_plan = {"nodes": [], "edges": []}
    for course in sorted(cohort.courses, key=lambda c: c.semester_number):
        education_plan["nodes"].append(course)
        for prereq in course.prerequisites:
            education_plan["edges"].append({"source": prereq.course_id, "target": course.course_id})
    return education_plan


@router.put("/{cohort_id}/graph", response_model=EducationPlanSchema)
async def update_cohort_education_plan_graph(cohort_id: int, education_plan: EducationPlanSchema):
    """Обновить граф учебного плана потока по учебному году"""
    cohort = await Cohort.get_by_id(cohort_id, relations=['courses.prerequisites', 'program'])
    education_plan = education_plan.model_dump(exclude_unset=True)
    nodes_dict = await Course.check_nodes(data=education_plan['nodes'], total_semesters=cohort.program.duration_years * 2)
    edges_dict = await Course.check_edges(edges=education_plan['edges'], nodes=nodes_dict)  # noqa F821

    # Обновляем курсы и связи
    await Course.update_cohort_courses(cohort, nodes_dict, edges_dict)

    # Получаем обновленную когорту с курсами для возврата
    await cohort.refresh_node('courses.prerequisites')
    result = {"nodes": [], "edges": []}
    for course in sorted(cohort.courses, key=lambda c: c.semester_number):
        result["nodes"].append(course)
        for prereq in course.prerequisites:
            result["edges"].append({"source": prereq.course_id, "target": course.course_id})

    return result
