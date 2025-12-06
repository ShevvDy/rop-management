from sqlalchemy import Column, ForeignKey

from ..base import Base


class CourseTag(Base):
    __tablename__ = "course_tag"

    course_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    tag_id = Column(ForeignKey("tag.tag_id", ondelete="CASCADE"), nullable=False, primary_key=True)
