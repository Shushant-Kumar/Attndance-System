"""
Module 4: AI Face Recognition (real-time).

This endpoint is stateless recognition only — it identifies who is in a
frame and with what confidence, but does not write attendance records.
Phase 5 builds the attendance-marking endpoint on top of this same
matching logic (via recognition_engine.match_face), adding the
once-per-day / duplicate-prevention rules.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.core.deps import get_current_admin
from app.schemas.recognition import RecognizeRequest, RecognizeResponse, FaceMatch, BoundingBox
from app.utils import face_utils
from app.utils.recognition_engine import load_known_students, match_face

router = APIRouter(prefix="/api/recognition", tags=["Face Recognition"])


@router.post("/identify", response_model=RecognizeResponse)
def identify_faces(
    payload: RecognizeRequest,
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

    faces: list[FaceMatch] = []
    for encoding, (top, right, bottom, left) in detected:
        result = match_face(encoding, known_students)

        faces.append(FaceMatch(
            is_known=result.is_known,
            confidence=result.confidence,
            student_id=result.student.student_id if result.student else None,
            full_name=result.student.full_name if result.student else None,
            roll_number=result.student.roll_number if result.student else None,
            box=BoundingBox(top=top, right=right, bottom=bottom, left=left),
        ))

    return RecognizeResponse(
        image_width=width,
        image_height=height,
        faces=faces,
        known_students_loaded=len(known_students),
    )


@router.get("/known-count")
def known_count(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    """Quick check used by the Live Camera page to warn if no one is registered yet."""
    return {"count": len(load_known_students(db))}
