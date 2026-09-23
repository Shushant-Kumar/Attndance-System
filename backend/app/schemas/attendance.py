from datetime import date, time as time_type
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

from app.schemas.recognition import BoundingBox


class MarkAttendanceRequest(BaseModel):
    image: str  # base64 data URL — same format as recognition/identify


class FaceMarkResult(BaseModel):
    is_known: bool
    confidence: float
    student_id: Optional[int] = None
    full_name: Optional[str] = None
    roll_number: Optional[str] = None
    box: BoundingBox
    # marked           -> new attendance row created just now
    # already_marked   -> student was already Present today, nothing changed
    # unknown          -> face didn't match any registered student
    # auto_registered  -> unknown face auto-registered as new student + attendance marked
    outcome: Literal["marked", "already_marked", "unknown", "auto_registered"]


class MarkAttendanceResponse(BaseModel):
    image_width: int
    image_height: int
    faces: list[FaceMarkResult]


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    full_name: str
    roll_number: str
    department: str
    date: date
    time: time_type
    status: str
    confidence: Optional[float] = None
    marked_by: str

    model_config = ConfigDict(from_attributes=True)


class TodaySummary(BaseModel):
    date: date
    total_students: int
    present_count: int
    absent_count: int
    attendance_percent: float
    records: list[AttendanceRecordOut]


class DailyTrendPoint(BaseModel):
    date: date
    label: str  # short display label, e.g. "Mon 04"
    present_count: int
    percent: float


class DashboardStats(BaseModel):
    total_students: int
    present_today: int
    absent_today: int
    attendance_percent: float
    trend: list[DailyTrendPoint]  # last 7 days, oldest first
    recent_activity: list[AttendanceRecordOut]  # most recent first, capped
