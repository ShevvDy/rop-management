from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from ..base import Base


class Specialization(Base):
    __tablename__ = "specialization"

    specialization_id = Column(BigInteger, primary_key=True)
    cohort_id = Column(ForeignKey("cohort.cohort_id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, unique=True)

    cohort = relationship(
        "Cohort", foreign_keys=[cohort_id], uselist=False, back_populates="specializations"
    )
    education_plan = relationship(
        "PlannedCourse",
        primaryjoin="""and_(
            Specialization.cohort_id == PlannedCourse.cohort_id,
            or_(
                PlannedCourse.specialization_id == Specialization.specialization_id,
                PlannedCourse.specialization_id.is_(None)
            )
        )""",
        uselist=True,
        order_by="PlannedCourse.semester_id",
        cascade="all, delete-orphan",
        back_populates="specialization",
    )
    groups = relationship(
        "Group",
        foreign_keys="[Group.specialization_id]",
        uselist=True,
        back_populates="specialization",
        order_by="Group.name",
    )
