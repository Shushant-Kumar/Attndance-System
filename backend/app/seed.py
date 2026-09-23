
"""
Seed or update the first admin login.

Run from the backend directory with:
    python -m app.seed
"""
import os

from app.database import SessionLocal, engine, Base
from app.models import Admin, Student, FaceDataset, Attendance, Log
from app.models.admin import RoleEnum
from app.core.security import hash_password


def seed_admin():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        email = os.getenv("ADMIN_EMAIL")
        password = os.getenv("ADMIN_PASSWORD")
        full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

        if not email or not password:
            raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding.")
        if len(password) < 12:
            raise RuntimeError("ADMIN_PASSWORD must be at least 12 characters.")

        existing = db.query(Admin).filter(Admin.email == email).first()

        if existing:
            existing.password_hash = hash_password(password)
            existing.full_name = full_name
            existing.role = RoleEnum.admin.value
            existing.is_active = True

            db.commit()

            print("Admin account updated successfully:")
            print(f"  email:    {email}")
            print(f"  password: {password}")
            return

        admin = Admin(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=RoleEnum.admin.value,
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Created admin account:")
        print(f"  email:    {email}")
        print(f"  password: {password}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()

