from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class StudentBase(BaseModel):
    roll_number: str
    full_name: str
    department: str
    year: str
    section: str
    email: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("email", "phone", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("roll_number", "full_name", "department", "year", "section")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("email", "phone", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StudentOut(StudentBase):
    id: int
    photo_path: Optional[str] = None
    is_active: bool
    has_face_data: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedStudents(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[StudentOut]
