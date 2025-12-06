from sqlalchemy import BigInteger, Column, DateTime, String
from sqlalchemy.orm import relationship

from ..base import Base


class User(Base):
    __tablename__ = "user"

    user_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    patronymic = Column(String)
    email = Column(String)
    phone = Column(String)
    isu_id = Column(BigInteger)
    avatar = Column(String)
    created_at = Column(DateTime, nullable=False, default=Base.now)
    updated_at = Column(DateTime, nullable=False, default=Base.now, onupdate=Base.now)

    student_data = relationship(
        "Student",
        foreign_keys="[Student.user_id]",
        uselist=True,
        back_populates="user",
        lazy="selectin",
        order_by="Student.start_date",
    )
    teacher_data = relationship(
        "Teacher",
        foreign_keys="[Teacher.user_id]",
        uselist=True,
        back_populates="user",
        lazy="selectin",
        order_by="Teacher.start_date",
    )
    directed_cohorts = relationship(
        "Cohort",
        foreign_keys="[Cohort.director_id]",
        uselist=True,
        back_populates="director",
        lazy="selectin",
        order_by="Cohort.cohort_year",
    )
    managed_cohorts = relationship(
        "Cohort",
        foreign_keys="[Cohort.manager_id]",
        uselist=True,
        back_populates="manager",
        lazy="selectin",
        order_by="Cohort.cohort_year",
    )
    tags = relationship(
        "Tag",
        secondary="user_tag",
        foreign_keys="[UserTag.user_id, UserTag.tag_id]",
        uselist=True,
        back_populates="users",
        lazy="selectin",
        order_by="Tag.name",
    )
    teacher_streams = relationship(
        "Stream",
        foreign_keys="[Stream.teacher_id]",
        uselist=True,
        back_populates="teacher",
        lazy="selectin",
        order_by="Stream.name",
    )
