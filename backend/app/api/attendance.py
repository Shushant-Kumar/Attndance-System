"""
Module 5: Attendance System.

Builds directly on Phase 4's recognition_engine.match_face(). The key
addition here is the once-per-day / duplicate-prevention rule, enforced
at TWO layers for safety:
  1. Application logic: check for an existing Attendance row for
     (student_id, today) before inserting.
  2. Database constraint: attendance.UNIQUE(student_id, date) from the
     Phase 1 schema — a hard backstop against race conditions (e.g. two
     rapid frames both trying to mark the same student in the same second).

Auto-registration: when an unknown face is detected, a new Student record
is automatically created as "Student N" so attendance can be marked
immediately. The admin can edit the student name/details later.
"""
from datetime import date as date_cls, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func as sa_func

from app.database import get_db
from app.models.student import Student
from app.models.attendance import Attendance, StatusEnum, MarkedByEnum
from app.models.admin import Admin
from app.core.deps import get_current_admin
from app.schemas.recognition import BoundingBox
from app.schemas.attendance import (
    MarkAttendanceRequest,
    MarkAttendanceResponse,
    FaceMarkResult,
    AttendanceRecordOut,
    TodaySummary,
    DailyTrendPoint,
    DashboardStats,
)
from app.utils import face_utils
from app.utils.recognition_engine import load_known_students, match_face, invalidate_students_cache

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _record_to_out(record: Attendance, student: Student) -> AttendanceRecordOut:
    return AttendanceRecordOut(
        id=record.id,
        student_id=student.id,
        full_name=student.full_name,
        roll_number=student.roll_number,
        department=student.department,
        date=record.date,
        time=record.time,
        status=record.status if isinstance(record.status, str) else record.status.value,
        confidence=record.confidence,
        marked_by=record.marked_by if isinstance(record.marked_by, str) else record.marked_by.value,
    )


def _next_student_number(db: Session) -> int:
    """
    Find the next auto-registration number by counting students
    whose roll_number starts with 'AUTO-'.
    """
    count = (
        db.query(sa_func.count(Student.id))
        .filter(Student.roll_number.like("AUTO-%"))
        .scalar()
    )
    return (count or 0) + 1


def _auto_register_student(
    db: Session, face_encoding_array, encoding_json: str
) -> Student:
    """
    Create a new Student record for an unknown face.
    Named "Student N" with roll_number "AUTO-N".
    """
    n = _next_student_number(db)
    student = Student(
        full_name=f"Student {n}",
        roll_number=f"AUTO-{n}",
        department="Unassigned",
        year="N/A",
        section="N/A",
        face_encoding=encoding_json,
        is_active=True,
    )
    db.add(student)
    db.flush()  # get the id without committing
    return student


@router.post("/mark", response_model=MarkAttendanceResponse)
def mark_attendance(
    payload: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    try:
        rgb_image = face_utils.decode_base64_image(payload.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    height, width = rgb_image.shape[0], rgb_image.shape[1]
    detected = face_utils.detect_all_faces(rgb_image)
    known_students = load_known_students(db)

    today = date_cls.today()
    now = datetime.now().time().replace(microsecond=0)

    results: list[FaceMarkResult] = []

    for encoding, (top, right, bottom, left) in detected:
        match = match_face(encoding, known_students)
        box = BoundingBox(top=top, right=right, bottom=bottom, left=left)

        if not match.is_known:
            # ── Auto-register unknown face as a new student ──
            encoding_json = face_utils.encoding_to_json(encoding)
            new_student = _auto_register_student(db, encoding, encoding_json)

            try:
                db.add(Attendance(
                    student_id=new_student.id,
                    date=today,
                    time=now,
                    status=StatusEnum.Present.value,
                    confidence=match.confidence,
                    marked_by=MarkedByEnum.AI.value,
                ))
                db.commit()
                invalidate_students_cache()
                outcome = "auto_registered"
            except IntegrityError:
                db.rollback()
                outcome = "already_marked"

            results.append(FaceMarkResult(
                is_known=True,
                confidence=match.confidence,
                student_id=new_student.id,
                full_name=new_student.full_name,
                roll_number=new_student.roll_number,
                box=box,
                outcome=outcome,
            ))
            continue

        student_id = match.student.student_id

        existing = (
            db.query(Attendance)
            .filter(Attendance.student_id == student_id, Attendance.date == today)
            .first()
        )

        if existing:
            results.append(FaceMarkResult(
                is_known=True,
                confidence=match.confidence,
                student_id=student_id,
                full_name=match.student.full_name,
                roll_number=match.student.roll_number,
                box=box,
                outcome="already_marked",
            ))
            continue

        # Not marked yet today -> create the record.
        try:
            db.add(Attendance(
                student_id=student_id,
                date=today,
                time=now,
                status=StatusEnum.Present.value,
                confidence=match.confidence,
                marked_by=MarkedByEnum.AI.value,
            ))
            db.commit()
            outcome = "marked"
        except IntegrityError:
            db.rollback()
            outcome = "already_marked"

        results.append(FaceMarkResult(
            is_known=True,
            confidence=match.confidence,
            student_id=student_id,
            full_name=match.student.full_name,
            roll_number=match.student.roll_number,
            box=box,
            outcome=outcome,
        ))

    return MarkAttendanceResponse(image_width=width, image_height=height, faces=results)


@router.post("/manual/{student_id}", response_model=AttendanceRecordOut)
def mark_attendance_manual(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    """Lets a teacher mark a student Present by hand (e.g. camera trouble)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today = date_cls.today()
    existing = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id, Attendance.date == today)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Attendance already marked for today")

    record = Attendance(
        student_id=student_id,
        date=today,
        time=datetime.now().time().replace(microsecond=0),
        status=StatusEnum.Present.value,
        confidence=None,
        marked_by=MarkedByEnum.Manual.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_to_out(record, student)


@router.get("/today", response_model=TodaySummary)
def get_today_attendance(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    today = date_cls.today()

    total_students = db.query(Student).filter(Student.is_active.is_(True)).count()

    records = (
        db.query(Attendance)
        .join(Student, Attendance.student_id == Student.id)
        .filter(Attendance.date == today)
        .order_by(Attendance.time.desc())
        .all()
    )

    present_count = len(records)
    absent_count = max(0, total_students - present_count)
    attendance_percent = round(
        (present_count / total_students * 100) if total_students else 0.0, 1
    )

    record_outs = [_record_to_out(r, r.student) for r in records]

    return TodaySummary(
        date=today,
        total_students=total_students,
        present_count=present_count,
        absent_count=absent_count,
        attendance_percent=attendance_percent,
        records=record_outs,
    )


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    """
    Dashboard data: today's numbers, a 7-day trend line, and the 10 most
    recent attendance records (newest first) for the "recent activity" feed.
    """
    today = date_cls.today()
    total_students = db.query(Student).filter(Student.is_active.is_(True)).count()

    # Today's counts
    today_records = (
        db.query(Attendance)
        .filter(Attendance.date == today)
        .count()
    )
    present_today = today_records
    absent_today = max(0, total_students - present_today)
    attendance_percent = round(
        (present_today / total_students * 100) if total_students else 0.0, 1
    )

    # 7-day trend (including today)
    trend_points: list[DailyTrendPoint] = []
    for days_ago in range(6, -1, -1):
        trend_date = today - timedelta(days=days_ago)
        count = db.query(Attendance).filter(Attendance.date == trend_date).count()
        percent = round((count / total_students * 100) if total_students else 0.0, 1)
        label = trend_date.strftime("%a %d")  # e.g. "Mon 04"
        trend_points.append(DailyTrendPoint(
            date=trend_date,
            label=label,
            present_count=count,
            percent=percent,
        ))

    # Recent activity (10 most recent records, newest first)
    recent = (
        db.query(Attendance)
        .join(Student, Attendance.student_id == Student.id)
        .order_by(Attendance.created_at.desc())
        .limit(10)
        .all()
    )
    recent_activity = [_record_to_out(r, r.student) for r in recent]

    return DashboardStats(
        total_students=total_students,
        present_today=present_today,
        absent_today=absent_today,
        attendance_percent=attendance_percent,
        trend=trend_points,
        recent_activity=recent_activity,
    )
