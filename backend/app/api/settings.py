"""
Module 8: Settings & System Configuration.

Endpoints for admins to manage their profile, security, and notification preferences.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.core.deps import get_current_admin
from app.core.security import hash_password, verify_password
from app.schemas.settings import ChangePasswordRequest, UpdateSettingsRequest, SettingsResponse
from app.schemas.auth import AdminOut

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/profile", response_model=SettingsResponse)
def get_profile(current_admin: Admin = Depends(get_current_admin)):
    """Fetch the current admin's profile and preferences."""
    return SettingsResponse(
        id=current_admin.id,
        full_name=current_admin.full_name,
        email=current_admin.email,
        role=current_admin.role,
        email_notifications_enabled=current_admin.email_notifications_enabled,
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Change the admin's password."""
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    current_admin.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.put("/profile", response_model=SettingsResponse)
def update_profile(
    payload: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Update the admin's profile (full name, email notifications)."""
    if payload.full_name:
        current_admin.full_name = payload.full_name.strip()
    if payload.email_notifications_enabled is not None:
        current_admin.email_notifications_enabled = payload.email_notifications_enabled

    db.commit()
    db.refresh(current_admin)

    return SettingsResponse(
        id=current_admin.id,
        full_name=current_admin.full_name,
        email=current_admin.email,
        role=current_admin.role,
        email_notifications_enabled=current_admin.email_notifications_enabled,
    )
