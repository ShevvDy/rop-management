from sqlalchemy import Column, ForeignKey

from ..base import Base


class StudentStream(Base):
    __tablename__ = "student_stream"

    student_id = Column(ForeignKey("student.student_id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(ForeignKey("stream.stream_id", ondelete="CASCADE"), nullable=False)
