"""
Module 4: AI Face Recognition — matching logic.

Kept separate from face_utils.py (raw image/encoding operations) so this
file is purely about the "compare a detected face against every registered
student" decision, which Phase 5's attendance logic will also call into.
"""
from dataclasses import dataclass
from typing import Optional

import numpy as np
from app.utils import face_recognition
from sqlalchemy.orm import Session

from app.config import settings
from app.models.student import Student
from app.utils.face_utils import encoding_from_json


@dataclass
class KnownStudent:
    student_id: int
    full_name: str
    roll_number: str
    encoding: np.ndarray


@dataclass
class MatchResult:
    is_known: bool
    confidence: float  # 0-100
    student: Optional[KnownStudent] = None


import time

_cached_students: Optional[list[KnownStudent]] = None
_cached_time: float = 0.0
CACHE_TTL_SECONDS: float = 60.0


def invalidate_students_cache():
    """Clear in-memory cache so next call queries DB fresh."""
    global _cached_students, _cached_time
    _cached_students = None
    _cached_time = 0.0


def load_known_students(db: Session, force_refresh: bool = False) -> list[KnownStudent]:
    """
    Loads every active student who has completed face registration.
    Uses an in-memory cache with TTL and instant invalidation to eliminate
    costly round-trips on real-time video frames.
    """
    global _cached_students, _cached_time
    now = time.time()
    if not force_refresh and _cached_students is not None and (now - _cached_time) < CACHE_TTL_SECONDS:
        return _cached_students

    rows = (
        db.query(Student)
        .filter(Student.is_active.is_(True), Student.face_encoding.isnot(None))
        .all()
    )
    _cached_students = [
        KnownStudent(
            student_id=s.id,
            full_name=s.full_name,
            roll_number=s.roll_number,
            encoding=encoding_from_json(s.face_encoding),
        )
        for s in rows
    ]
    _cached_time = now
    return _cached_students


def match_face(
    face_encoding: np.ndarray,
    known_students: list[KnownStudent],
    tolerance: Optional[float] = None,
) -> MatchResult:
    """
    Compares one detected face encoding against every known student and
    returns the closest match if it's within tolerance, else "unknown".

    face_recognition.face_distance returns Euclidean distance in the 128-d
    embedding space — lower is more similar. A typical same-person distance
    is well under 0.4; different people are usually well over 0.6.
    We convert distance to a 0-100 confidence score for the UI/reports.
    """
    tolerance = tolerance if tolerance is not None else settings.FACE_MATCH_TOLERANCE

    if not known_students:
        return MatchResult(is_known=False, confidence=0.0)

    known_encodings = np.stack([s.encoding for s in known_students], axis=0)
    distances = face_recognition.face_distance(known_encodings, face_encoding)

    best_index = int(np.argmin(distances))
    best_distance = float(distances[best_index])
    confidence = round(max(0.0, (1.0 - best_distance)) * 100, 1)

    if best_distance <= tolerance:
        return MatchResult(
            is_known=True,
            confidence=confidence,
            student=known_students[best_index],
        )

    return MatchResult(is_known=False, confidence=confidence)
