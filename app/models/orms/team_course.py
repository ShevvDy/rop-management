from sqlalchemy import Column, ForeignKey

from ..base import Base


class TeamCourse(Base):
    __tablename__ = "team_course"

    team_id = Column(ForeignKey("team.team_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    course_id = Column(ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False, primary_key=True)
