from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship

from ..base import Base


class Prerequisite(Base):
    __tablename__ = "prerequisite"

    course_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    prerequisite_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False, primary_key=True)
