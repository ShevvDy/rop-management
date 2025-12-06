from sqlalchemy import BigInteger, Column, Integer, VARCHAR
from sqlalchemy.orm import relationship

from ..base import Base


class Semester(Base):
    __tablename__ = "semester"

    semester_id = Column(BigInteger, primary_key=True)
    semester_number = Column(Integer, nullable=False)
    study_year = Column(VARCHAR(9), nullable=False)
