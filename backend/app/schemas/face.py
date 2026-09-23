from pydantic import BaseModel, Field


class CaptureRequest(BaseModel):
    # Data URL from <canvas>.toDataURL('image/jpeg') on the frontend
    image: str = Field(..., description="Base64 data URL of the captured frame")


class CaptureResponse(BaseModel):
    capture_index: int
    total_captured: int
    target: int
    min_required: int
    is_complete: bool  # True once total_captured >= target


class StatusResponse(BaseModel):
    student_id: int
    total_captured: int
    target: int
    min_required: int
    is_finalized: bool
    image_paths: list[str]


class FinalizeResponse(BaseModel):
    student_id: int
    images_used: int
    message: str
