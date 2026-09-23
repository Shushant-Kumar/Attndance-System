
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import (
    auth,
    students,
    face_registration,
    recognition,
    attendance,
    reports,
    settings as settings_router,
)

app = FastAPI(
    title="AI Smart Attendance System API",
    description="Backend for face-recognition based attendance tracking",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(face_registration.router)
app.include_router(recognition.router)
app.include_router(attendance.router)
app.include_router(reports.router)
app.include_router(settings_router.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "env": settings.ENV}

