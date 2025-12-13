from sqlalchemy import Column, ForeignKey

from ..base import Base


class CheckpointTag(Base):
    __tablename__ = "checkpoint_tag"

    checkpoint_id = Column(ForeignKey("checkpoint.checkpoint_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    tag_id = Column(ForeignKey("tag.tag_id", ondelete="CASCADE"), nullable=False, primary_key=True)
