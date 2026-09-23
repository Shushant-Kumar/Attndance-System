from sqlalchemy import (
    Column, Integer, String, Date, Time, Float, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class StatusEnum(str, enum.Enum):
    Present = "Present"
    Absent = "Absent"


class MarkedByEnum(str, enum.Enum):
    AI = "AI"
    Manual = "Manual"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    status = Column(String, default=StatusEnum.Present.value, nullable=False)
    confidence = Column(Float, nullable=True)
    marked_by = Column(String, default=MarkedByEnum.AI.value, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("student_id", "date", name="uniq_student_date"),
    )
