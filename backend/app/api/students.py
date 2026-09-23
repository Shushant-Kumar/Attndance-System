from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.student import Student
from app.models.admin import Admin
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut, PaginatedStudents
from app.core.deps import get_current_admin
from app.utils.recognition_engine import invalidate_students_cache

router = APIRouter(prefix="/api/students", tags=["Students"])


def _to_out(s: Student) -> StudentOut:
    out = StudentOut.model_validate(s)
    out.has_face_data = bool(s.face_encoding)
    return out


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    existing = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if existing:
        raise HTTPException(status_code=409, detail="Roll number already exists")

    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return _to_out(student)


@router.get("", response_model=PaginatedStudents)
def list_students(
    search: Optional[str] = Query(None, description="Search by name or roll number"),
    department: Optional[str] = None,
    year: Optional[str] = None,
    section: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    q = db.query(Student)

    if search:
        like = f"%{search.strip()}%"
        q = q.filter(or_(Student.full_name.ilike(like), Student.roll_number.ilike(like)))
    if department:
        q = q.filter(Student.department == department)
    if year:
        q = q.filter(Student.year == year)
    if section:
        q = q.filter(Student.section == section)

    total = q.count()
    items = (
        q.order_by(Student.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedStudents(
        total=total, page=page, page_size=page_size, items=[_to_out(s) for s in items]
    )


@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _to_out(student)


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    invalidate_students_cache()
    return _to_out(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)  # cascades to face_dataset and attendance rows
    db.commit()
    invalidate_students_cache()
    return None
