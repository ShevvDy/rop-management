from sqlalchemy import BigInteger, Column, ForeignKey, Date, ARRAY, String
from sqlalchemy.orm import relationship

from ..base import Base


class Checkpoint(Base):
    __tablename__ = "checkpoint"

    checkpoint_id = Column(BigInteger, primary_key=True)
    stream_id = Column(ForeignKey("stream.stream_id", ondelete="CASCADE"), nullable=False)
    checkpoint_date = Column(Date, nullable=True)
    materials = Column(ARRAY(String), nullable=False, default=[])
    notes = Column(String, nullable=True)

    stream = relationship("Stream", foreign_keys=[stream_id], uselist=False, back_populates="checkpoints")
    tags = relationship(
        "Tag",
        secondary="checkpoint_tag",
        foreign_keys="[CheckpointTag.checkpoint_id, CheckpointTag.tag_id]",
        uselist=True,
        back_populates="checkpoints",
        order_by="Tag.name",
    )
