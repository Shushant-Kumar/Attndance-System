"""
Module 3: Face Dataset Collection.

Flow driven by the frontend's Register Face page:
  1. GET    /api/face-registration/{student_id}/status   -> how many captured so far
  2. POST   /api/face-registration/{student_id}/capture   -> called once per frame,
       ~20-30 times, as the browser auto-captures a burst from the webcam
  3. POST   /api/face-registration/{student_id}/finalize  -> average all encodings
       into student.face_encoding once enough images exist
  4. DELETE /api/face-registration/{student_id}/reset     -> wipe and start over
       (the "allow recapture" requirement)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.student import Student
from app.models.face_dataset import FaceDataset
from app.models.admin import Admin
from app.models.log import Log
from app.schemas.face import CaptureRequest, CaptureResponse, StatusResponse, FinalizeResponse
from app.core.deps import get_current_admin
from app.utils import face_utils
from app.utils.recognition_engine import invalidate_students_cache

router = APIRouter(prefix="/api/face-registration", tags=["Face Registration"])

TARGET_IMAGES = 25       # aim for 20-30 as per spec
MIN_REQUIRED_IMAGES = 15  # minimum to allow "finalize" if a teacher stops early


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/status", response_model=StatusResponse)
def get_status(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = _get_student_or_404(db, student_id)
    captures = (
        db.query(FaceDataset)
        .filter(FaceDataset.student_id == student_id)
        .order_by(FaceDataset.capture_index)
        .all()
    )
    return StatusResponse(
        student_id=student_id,
        total_captured=len(captures),
        target=TARGET_IMAGES,
        min_required=MIN_REQUIRED_IMAGES,
        is_finalized=bool(student.face_encoding),
        image_paths=[c.image_path for c in captures],
    )


@router.post("/{student_id}/capture", response_model=CaptureResponse)
def capture_face(
    student_id: int,
    payload: CaptureRequest,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = _get_student_or_404(db, student_id)

    existing_count = (
        db.query(FaceDataset).filter(FaceDataset.student_id == student_id).count()
    )
    if existing_count >= TARGET_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Already captured {TARGET_IMAGES} images. Reset to recapture.",
        )

    try:
        rgb_image = face_utils.decode_base64_image(payload.image)
        encoding, _box = face_utils.detect_single_face_encoding(rgb_image)
    except face_utils.NoFaceDetected as e:
        raise HTTPException(status_code=422, detail=str(e))
    except face_utils.MultipleFacesDetected as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    capture_index = existing_count + 1
    image_path = face_utils.save_capture_image(rgb_image, student_id, capture_index)

    db.add(FaceDataset(
        student_id=student_id,
        image_path=image_path,
        encoding=face_utils.encoding_to_json(encoding),
        capture_index=capture_index,
    ))
    db.commit()

    total_captured = capture_index
    return CaptureResponse(
        capture_index=capture_index,
        total_captured=total_captured,
        target=TARGET_IMAGES,
        min_required=MIN_REQUIRED_IMAGES,
        is_complete=total_captured >= TARGET_IMAGES,
    )


@router.post("/{student_id}/finalize", response_model=FinalizeResponse)
def finalize_registration(
    student_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    student = _get_student_or_404(db, student_id)
    captures = db.query(FaceDataset).filter(FaceDataset.student_id == student_id).all()

    if len(captures) < MIN_REQUIRED_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Need at least {MIN_REQUIRED_IMAGES} captured images "
                f"before finalizing (have {len(captures)})."
            ),
        )

    encodings = [face_utils.encoding_from_json(c.encoding) for c in captures]
    averaged = face_utils.average_encodings(encodings)

    student.face_encoding = face_utils.encoding_to_json(averaged)
    db.add(Log(
        admin_id=admin.id,
        action="FACE_REGISTERED",
        details=f"Finalized face profile for student_id={student_id} "
                f"using {len(captures)} images",
    ))
    db.commit()
    invalidate_students_cache()

    return FinalizeResponse(
        student_id=student_id,
        images_used=len(captures),
        message="Face profile created successfully. This student can now be recognized.",
    )


@router.delete("/{student_id}/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset_registration(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    student = _get_student_or_404(db, student_id)

    db.query(FaceDataset).filter(FaceDataset.student_id == student_id).delete()
    student.face_encoding = None
    db.commit()
    invalidate_students_cache()

    face_utils.delete_student_dataset_dir(student_id)
    return None
