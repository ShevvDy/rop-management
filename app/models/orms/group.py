from sqlalchemy import BigInteger, Column, ForeignKey, VARCHAR
from sqlalchemy.orm import relationship

from ..base import Base


class Group(Base):
    __tablename__ = "group"

    group_id = Column(BigInteger, primary_key=True)
    name = Column(VARCHAR(10), nullable=False, unique=True)
    program_id = Column(ForeignKey("program.program_id", ondelete="CASCADE"), nullable=False)
    specialization_id = Column(ForeignKey("specialization.specialization_id", ondelete="SET NULL"), nullable=True)

    students = relationship(
        "Student",
        foreign_keys="[Student.group_id]",
        uselist=True,
        back_populates="group",
    )
    program = relationship(
        "Program", foreign_keys=[program_id], uselist=False, lazy="selectin", back_populates="groups"
    )
    specialization = relationship(
        "Specialization", foreign_keys=[specialization_id], uselist=False, lazy="selectin", back_populates="groups"
    )
