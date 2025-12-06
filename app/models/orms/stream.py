from sqlalchemy import BigInteger, Column, Date, Enum, ForeignKey, VARCHAR
from sqlalchemy.orm import relationship

from ..base import Base
from ..enums import EducationForm


class Stream(Base):
    __tablename__ = "stream"

    stream_id = Column(BigInteger, primary_key=True)
    semester_id = Column(ForeignKey("semester.semester_id", ondelete="CASCADE"), nullable=False)
    course_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    form = Column(Enum(EducationForm), nullable=False, default=EducationForm.offline)
    name = Column(VARCHAR(15), nullable=False)
    start_date = Column(Date, nullable=False)
    exam_date = Column(Date, nullable=True)

    course = relationship("Course", foreign_keys=[course_id], uselist=False, lazy="selectin")
    teacher = relationship(
        "User", foreign_keys=[teacher_id], uselist=False, lazy="selectin", back_populates="teacher_streams"
    )
    students = relationship(
        "Student",
        secondary="student_stream",
        foreign_keys="[StudentStream.student_id, StudentStream.stream_id]",
        uselist=True,
        back_populates="streams",
        lazy="selectin",
    )

    @property
    def is_active(self) -> bool:
        return self.start_date <= Base.today() < self.exam_date
