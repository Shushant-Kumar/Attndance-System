from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttendanceSearchParams(BaseModel):
    """Query parameters for attendance history search."""
    search: Optional[str] = None  # name or roll number
    department: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    page: int = 1
    page_size: int = 20


class PaginatedAttendanceRecords(BaseModel):
    total: int
    page: int
    page_size: int
    items: list["AttendanceRecordOut"]


class AttendanceReportData(BaseModel):
    """Payload for PDF/Excel export."""
    title: str  # e.g. "Attendance Report: CSE 2nd Year"
    generated_date: str
    filters: dict  # { "department": "CSE", "year": "2nd", ... }
    summary: dict  # { "total_records": 150, "total_present": 145, ... }
    records: list["AttendanceRecordOut"]


# Import AttendanceRecordOut from attendance module to avoid circular imports
from app.schemas.attendance import AttendanceRecordOut

PaginatedAttendanceRecords.model_rebuild()
AttendanceReportData.model_rebuild()
