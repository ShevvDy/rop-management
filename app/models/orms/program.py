from sqlalchemy import BigInteger, Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..base import Base
from ..enums import EducationForm, EducationLang, EducationLevel


class Program(Base):
    __tablename__ = "program"

    program_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    accreditation_year = Column(Integer, nullable=False)
    level = Column(Enum(EducationLevel), nullable=False)
    form = Column(Enum(EducationForm), nullable=False, default=EducationForm.offline)
    lang = Column(Enum(EducationLang), nullable=False)
    duration_years = Column(Integer, nullable=False)
    faculty_id = Column(ForeignKey("faculty.faculty_id", ondelete="CASCADE"), nullable=False)

    faculty = relationship(
        "Faculty", foreign_keys=[faculty_id], uselist=False, back_populates="programs"
    )
    cohorts = relationship(
        "Cohort",
        foreign_keys="[Cohort.program_id]",
        uselist=True,
        back_populates="program",
        order_by="Cohort.cohort_year",
        cascade="all, delete-orphan",
    )
    groups = relationship(
        "Group",
        foreign_keys="[Group.program_id]",
        uselist=True,
        back_populates="program",
        order_by="Group.name",
        cascade="all, delete-orphan",
    )
