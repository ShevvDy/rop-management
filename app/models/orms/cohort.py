from sqlalchemy import BigInteger, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from ..base import Base


class Cohort(Base):
    __tablename__ = "cohort"

    cohort_id = Column(BigInteger, primary_key=True)
    program_id = Column(ForeignKey("program.program_id", ondelete="CASCADE"), nullable=False)
    cohort_year = Column(Integer, nullable=False, default=lambda: Base.now().year)
    director_id = Column(ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    manager_id = Column(ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)

    program = relationship(
        "Program", foreign_keys=[program_id], uselist=False, lazy="selectin", back_populates="cohorts"
    )
    specializations = relationship(
        "Specialization",
        foreign_keys="[Specialization.cohort_id]",
        uselist=True,
        back_populates="cohort",
        lazy="selectin",
        order_by="Specialization.name",
    )
    education_plan = relationship(
        "PlannedCourse",
        foreign_keys="[PlannedCourse.cohort_id]",
        uselist=True,
        back_populates="cohort",
        lazy="selectin",
        order_by="PlannedCourse.semester_id",
    )
    director = relationship(
        "User", foreign_keys=[director_id], uselist=False, lazy="selectin", back_populates="directed_cohorts"
    )
    manager = relationship(
        "User", foreign_keys=[manager_id], uselist=False, lazy="selectin", back_populates="managed_cohorts"
    )
    students = relationship(
        "Student",
        foreign_keys="[Student.cohort_id]",
        uselist=True,
        back_populates="cohort",
    )
