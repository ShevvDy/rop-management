from sqlalchemy import Column, ForeignKey

from ..base import Base


class TeamMember(Base):
    __tablename__ = "team_member"

    team_id = Column(ForeignKey("team.team_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
