from sqlalchemy import BigInteger, Boolean, Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from ..base import Base
from ..enums import EducationForm


class Course(Base):
    __tablename__ = "course"

    course_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    form = Column(Enum(EducationForm, name='education_form'), nullable=False, default=EducationForm.offline)
    is_elective = Column(Boolean, nullable=False, default=False)
    syllabus_link = Column(String, nullable=True)
    rpd_link = Column(String, nullable=True)

    prerequisites = relationship(
        "Course",
        secondary="prerequisite",
        primaryjoin="Course.course_id == Prerequisite.course_id",
        secondaryjoin="Course.course_id == Prerequisite.prerequisite_id",
        uselist=True,
    )
    tags = relationship(
        "Tag",
        secondary="course_tag",
        foreign_keys="[CourseTag.course_id, CourseTag.tag_id]",
        uselist=True,
        back_populates="courses",
        order_by="Tag.name",
    )
