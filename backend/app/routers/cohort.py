from fastapi import APIRouter, status
from typing import List

from ..exceptions import BadRequestException
from ..models import Cohort, Course, Student, Specialization
from ..schemas import CohortCreateSchema, CohortUpdateSchema, CohortResponseSchema, CohortWithRelationsSchema, EducationPlanSchema, CohortStudentsResponseSchema, CohortStudentUpdateSchema

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
    return await Cohort.get_by_id(cohort_id, relations=['program.faculty', 'director', 'manager', 'specializations'])


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


@router.get('/{cohort_id}/students', response_model=CohortStudentsResponseSchema)
async def get_cohort_students(cohort_id: int):
    cohort = await Cohort.get_by_id(cohort_id)
    return await cohort.get_students()


@router.put('/{cohort_id}/students', response_model=CohortStudentsResponseSchema)
async def update_cohort_students(cohort_id: int, students: list[CohortStudentUpdateSchema]):
    cohort = await Cohort.get_by_id(cohort_id)
    students_update = []

    for student in students:
        student_id = student.student_id
        specialization_id = student.specialization_id
        student_node = await Student.get_by_id(student_id, relations=['cohort', 'specialization'])
        if student_node.cohort.cohort_id != cohort.cohort_id:
            raise BadRequestException(message=f"Студент {student_id} не числится в указанном годе набора")
        if specialization_id is None:
            students_update.append({'student': student_node, 'specialization': specialization_id})
        else:
            specialization_node = await Specialization.get_by_id(specialization_id, relations=['cohort'])
            if specialization_node.cohort.cohort_id != cohort.cohort_id:
                raise BadRequestException(message=f"Специализация '{specialization_node.name}' не относится к указанному году набора")
            students_update.append({'student': student_node, 'specialization': specialization_node})

    for update_data in students_update:
        student = update_data['student']
        specialization = update_data['specialization']

        if student.specialization is not None:
            if (
                specialization is not None and
                student.specialization.specialization_id == specialization.specialization_id
            ):
                continue
            await student.specialization_rel.disconnect_all()

        if specialization is not None:
            await student.specialization_rel.connect(specialization)

    await cohort.refresh_node()
    return await cohort.get_students()
