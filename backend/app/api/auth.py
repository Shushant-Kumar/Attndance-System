from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.log import Log
from app.schemas.auth import LoginRequest, TokenResponse, AdminOut
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()

    # Same generic error whether email or password is wrong (avoids user enumeration)
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated",
        )

    token = create_access_token({"sub": str(admin.id), "role": admin.role})

    db.add(Log(
        admin_id=admin.id,
        action="LOGIN",
        details=f"{admin.email} logged in",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    return TokenResponse(access_token=token, admin=AdminOut.model_validate(admin))


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    JWTs are stateless, so 'logout' is enforced client-side (token discarded).
    We still record the event server-side for audit purposes.
    """
    db.add(Log(
        admin_id=current_admin.id,
        action="LOGOUT",
        details=f"{current_admin.email} logged out",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=AdminOut)
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin
