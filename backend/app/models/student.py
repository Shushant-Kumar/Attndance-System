from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(String, nullable=False)
    section = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    face_encoding = Column(Text, nullable=True)  # JSON-serialized averaged encoding
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    face_images = relationship(
        "FaceDataset", back_populates="student", cascade="all, delete-orphan"
    )
    attendance_records = relationship(
        "Attendance", back_populates="student", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_dept_year_section", "department", "year", "section"),
    )
