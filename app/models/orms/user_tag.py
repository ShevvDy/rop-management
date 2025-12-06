from sqlalchemy import Column, ForeignKey

from ..base import Base


class UserTag(Base):
    __tablename__ = "user_tag"

    user_id = Column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    tag_id = Column(ForeignKey("tag.tag_id", ondelete="CASCADE"), nullable=False, primary_key=True)
