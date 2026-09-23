from typing import Optional
from pydantic import BaseModel


class RecognizeRequest(BaseModel):
    image: str  # base64 data URL, same format as face-registration capture


class BoundingBox(BaseModel):
    top: int
    right: int
    bottom: int
    left: int


class FaceMatch(BaseModel):
    is_known: bool
    confidence: float  # 0-100
    student_id: Optional[int] = None
    full_name: Optional[str] = None
    roll_number: Optional[str] = None
    box: BoundingBox


class RecognizeResponse(BaseModel):
    image_width: int
    image_height: int
    faces: list[FaceMatch]
    known_students_loaded: int  # how many registered profiles were compared against
