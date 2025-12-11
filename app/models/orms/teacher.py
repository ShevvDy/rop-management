from sqlalchemy import BigInteger, Column, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..base import Base
from ..enums import TeacherPosition


class Teacher(Base):
    __tablename__ = "teacher"

    teacher_id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(ForeignKey("faculty.faculty_id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    position = Column(Enum(TeacherPosition), nullable=False)

    user = relationship(
        "User", foreign_keys=[user_id], uselist=False, back_populates="teacher_data"
    )
