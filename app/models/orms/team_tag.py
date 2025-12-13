from sqlalchemy import Column, ForeignKey

from ..base import Base


class TeamTag(Base):
    __tablename__ = "team_tag"

    team_id = Column(ForeignKey("team.team_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    tag_id = Column(ForeignKey("tag.tag_id", ondelete="CASCADE"), nullable=False, primary_key=True)
