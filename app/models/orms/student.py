from sqlalchemy import BigInteger, Column, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..base import Base
from ..enums import StudentStatus


class Student(Base):
    __tablename__ = "student"

    student_id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    cohort_id = Column(ForeignKey("cohort.cohort_id", ondelete="CASCADE"), nullable=False)
    group_id = Column(ForeignKey("group.group_id", ondelete="SET NULL"), nullable=True)
    start_date = Column(Date, nullable=False, default=lambda: Base.today().replace(month=9, day=1))
    end_date = Column(Date, nullable=False)
    status = Column(Enum(StudentStatus, name='student_status'), nullable=True)

    user = relationship(
        "User", foreign_keys=[user_id], uselist=False, back_populates="student_data"
    )
    cohort = relationship(
        "Cohort", foreign_keys=[cohort_id], uselist=False, back_populates="students"
    )
    group = relationship(
        "Group", foreign_keys=[group_id], uselist=False, back_populates="students"
    )
    streams = relationship(
        "Stream",
        secondary="student_stream",
        foreign_keys="[StudentStream.stream_id, StudentStream.student_id]",
        uselist=True,
        back_populates="students",
    )

    @property
    def is_active(self) -> bool:
        return self.start_date <= Base.today() < self.end_date
