from sqlalchemy import BigInteger, Column, ForeignKey, Boolean, String
from sqlalchemy.orm import relationship

from ..base import Base


class Team(Base):
    __tablename__ = "team"

    team_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False)
    owner_id = Column(ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    is_visible = Column(Boolean, nullable=False, default=True)

    owner = relationship("User", foreign_keys=[owner_id], uselist=False, back_populates="owned_teams")
    tags = relationship(
        "Tag",
        secondary="team_tag",
        foreign_keys="[TeamTag.team_id, TeamTag.tag_id]",
        uselist=True,
        back_populates="teams",
        order_by="Tag.name",
    )
    members = relationship(
        "User",
        secondary="team_member",
        foreign_keys="[TeamMember.team_id, TeamMember.user_id]",
        uselist=True,
        back_populates="teams",
        order_by="User.surname, User.name, User.patronymic",
    )
    courses = relationship(
        "Course",
        secondary="team_course",
        foreign_keys="[TeamCourse.team_id, TeamCourse.course_id]",
        uselist=True,
        back_populates="teams",
        order_by="Course.name",
    )
