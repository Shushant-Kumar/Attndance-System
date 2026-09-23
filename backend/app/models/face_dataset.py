from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FaceDataset(Base):
    __tablename__ = "face_dataset"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String, nullable=False)
    encoding = Column(Text, nullable=False)  # JSON-serialized 128-d face encoding
    capture_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="face_images")
