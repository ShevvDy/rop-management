from typing import Any

from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo, AsyncOne, AsyncZeroOrOne, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Cohort(BaseNode):
    """Год набора студентов"""

    cohort_id = IntegerProperty(unique_index=True)
    cohort_year = IntegerProperty(default=lambda: BaseNode.now().year)

    # Связи (исходящие)
    program_rel = AsyncRelationshipTo(
        ".program.Program",
        "BELONGS_TO_PROGRAM",
        AsyncOne,
    )

    director_rel = AsyncRelationshipTo(
        ".user.User",
        "DIRECTS_BY",
        AsyncZeroOrOne,
    )

    manager_rel = AsyncRelationshipTo(
        ".user.User",
        "MANAGES_BY",
        AsyncZeroOrOne,
    )

    # Связи (входящие)
    specializations_rel = AsyncRelationshipFrom(
        ".specialization.Specialization",
        "BELONGS_TO_COHORT",
        AsyncZeroOrMore,
    )

    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "ENROLLED_IN_COHORT",
        AsyncZeroOrMore,
    )

    courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "PLANNED_FOR_COHORT",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .program import Program
        from .user import User

        await cls._check_relationship_before_creation(data, 'program', Program)
        await cls._check_relationship_before_creation(data, 'director', User)
        await cls._check_relationship_before_creation(data, 'manager', User)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'program')
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')

    async def _before_update(self, data: DictStrAny) -> None:
        from .user import User

        await self._check_relationship_before_update(data, 'director', User)
        await self._check_relationship_before_update(data, 'manager', User)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')

    async def get_education_plan(self) -> dict[str, list[dict[str, Any]]]:
        await self.load_relations('courses.prerequisites', 'courses.elective_students', 'courses.teachers', 'courses.specialization', 'courses.tags')
        education_plan = {"nodes": [], "edges": []}
        for course in sorted(self.courses, key=lambda c: c.semester_number):
            course._relations['elective_students_ids'] = [student.student_id for student in course.elective_students]
            course._relations['teachers_ids'] = [teacher.user_id for teacher in course.teachers]
            spec = course.specialization if hasattr(course, 'specialization') and course.specialization else None
            course._relations['specialization_id'] = spec.specialization_id if spec else None
            course._relations['specialization_name'] = spec.name if spec else None
            course._relations['tags_data'] = [{"tag_id": t.tag_id, "name": t.name} for t in (course.tags if hasattr(course, 'tags') else [])]
            education_plan["nodes"].append(course)
            for prereq in course.prerequisites:
                education_plan["edges"].append({"source": prereq.course_id, "target": course.course_id})
        return education_plan

    async def get_students(self) -> dict[str, list[dict[str, Any]]]:
        await self.load_relations('specializations', 'students.user', 'students.specialization')
        students = []
        for student in self.students:
            students.append({
                'student_id': student.student_id,
                'start_date': student.start_date,
                'end_date': student.end_date,
                'status': student.status,
                'user': student.user,
                'specialization_id': student.specialization.specialization_id if student.specialization else None,
            })
        specializations = []
        for specialization in self.specializations:
            specializations.append({
                'name': specialization.name,
                'specialization_id': specialization.specialization_id,
            })
        return {"students": students, "specializations": specializations}
