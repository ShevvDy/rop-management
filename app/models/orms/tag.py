from sqlalchemy import BigInteger, Column, String
from sqlalchemy.orm import relationship

from ..base import Base


class Tag(Base):
    __tablename__ = "tag"

    tag_id = Column(BigInteger, primary_key=True)
    name = Column(String, nullable=False, unique=True)

    users = relationship(
        "User",
        secondary="user_tag",
        foreign_keys="[UserTag.tag_id, UserTag.user_id]",
        uselist=True,
        back_populates="tags",
        order_by="User.surname, User.name, User.patronymic",
    )
    courses = relationship(
        "Course",
        secondary="course_tag",
        foreign_keys="[CourseTag.tag_id, CourseTag.course_id]",
        uselist=True,
        back_populates="tags",
        order_by="Course.name",
    )
    checkpoints = relationship(
        "Checkpoint",
        secondary="checkpoint_tag",
        foreign_keys="[CheckpointTag.tag_id, CheckpointTag.checkpoint_id]",
        uselist=True,
        back_populates="tags",
        order_by="Checkpoint.checkpoint_date",
    )
    teams = relationship(
        "Team",
        secondary="team_tag",
        foreign_keys="[TeamTag.tag_id, TeamTag.team_id]",
        uselist=True,
        back_populates="tags",
        order_by="Team.name",
    )
