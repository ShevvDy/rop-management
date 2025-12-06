from sqlalchemy import BigInteger, Column, Date, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from ..base import Base


class PlannedCourse(Base):
    __tablename__ = "planned_course"

    planned_course_id = Column(BigInteger, primary_key=True)
    cohort_id = Column(ForeignKey("cohort.cohort_id", ondelete="CASCADE"), nullable=False)
    specialization_id = Column(ForeignKey("specialization.specialization_id", ondelete="CASCADE"), nullable=True)
    course_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(ForeignKey("semester.semester_id"), nullable=False)

    cohort = relationship(
        "Cohort", foreign_keys=[cohort_id], uselist=False, lazy="selectin", back_populates="education_plan"
    )
    specialization = relationship(
        "Specialization",
        foreign_keys=[specialization_id],
        uselist=False,
        lazy="selectin",
    )
    course = relationship("Course", foreign_keys=[course_id], uselist=False, lazy="selectin")
    semester = relationship("Semester", foreign_keys=[semester_id], uselist=False, lazy="selectin")
