from sqlalchemy import BigInteger, Column, DateTime, String, VARCHAR
from sqlalchemy.orm import relationship

from ..base import Base


class Faculty(Base):
    __tablename__ = "faculty"

    faculty_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    short_name = Column(VARCHAR(10), nullable=False, unique=True)
    created_at = Column(DateTime, default=Base.now)

    programs = relationship(
        "Program",
        foreign_keys="[Program.faculty_id]",
        uselist=True,
        back_populates="faculty",
        order_by="Program.program_id",
        cascade="all, delete-orphan",
    )
    teachers = relationship(
        "Teacher",
        foreign_keys="[Teacher.faculty_id]",
        uselist=True,
        back_populates="faculty",
        order_by="Teacher.teacher_id",
        cascade="all, delete-orphan",
    )
