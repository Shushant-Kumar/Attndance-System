from pydantic import BaseModel, EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateSettingsRequest(BaseModel):
    full_name: str = None
    email_notifications_enabled: bool = None


class SettingsResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    email_notifications_enabled: bool
