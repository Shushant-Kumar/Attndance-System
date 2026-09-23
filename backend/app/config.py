"""
Central application configuration.
Reads values from environment variables / .env file.
"""

from pathlib import Path
import os

from dotenv import load_dotenv


class Settings:
    # PostgreSQL (Neon, Render, or local)
    SUPABASE_DATABASE_URL: str = ""

    # JWT
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 120

    # App
    ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Face recognition
    FACE_MATCH_TOLERANCE: float = 0.45
    FACE_DATASET_DIR: str = "../dataset"
    YOLO_FACE_MODEL: str = (
        "https://github.com/akanametov/yolo-face/releases/download/1.0.0/"
        "yolov11n-face.pt"
    )
    YOLO_FACE_CONFIDENCE: float = 0.35
    YOLO_FACE_IMAGE_SIZE: int = 640

    def __init__(self):
        # Load backend/.env
        env_path = Path(__file__).resolve().parents[1] / ".env"
        load_dotenv(env_path)

        # Database URL (Local PostgreSQL / Docker or Supabase)
        self.DATABASE_URL_ENV = os.getenv("DATABASE_URL", "")
        self.SUPABASE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL", "")

        # JWT
        self.JWT_SECRET_KEY = os.getenv(
            "JWT_SECRET_KEY",
            ""
        )
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.JWT_EXPIRE_MINUTES = int(
            os.getenv("JWT_EXPIRE_MINUTES", "120")
        )

        # App
        self.ENV = os.getenv("ENV", "development")
        self.CORS_ORIGINS = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000"
        )

        # Face recognition
        self.FACE_MATCH_TOLERANCE = float(
            os.getenv("FACE_MATCH_TOLERANCE", "0.45")
        )
        self.FACE_DATASET_DIR = os.getenv(
            "FACE_DATASET_DIR",
            "../dataset"
        )
        self.YOLO_FACE_MODEL = os.getenv(
            "YOLO_FACE_MODEL",
            (
                "https://github.com/akanametov/yolo-face/releases/download/1.0.0/"
                "yolov11n-face.pt"
            )
        )
        self.YOLO_FACE_CONFIDENCE = float(
            os.getenv("YOLO_FACE_CONFIDENCE", "0.35")
        )
        self.YOLO_FACE_IMAGE_SIZE = int(
            os.getenv("YOLO_FACE_IMAGE_SIZE", "640")
        )

        if self.ENV == "production":
            if not self.JWT_SECRET_KEY or len(self.JWT_SECRET_KEY) < 32:
                raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters in production.")
            if not self.DATABASE_URL_ENV and not self.SUPABASE_DATABASE_URL:
                raise RuntimeError("DATABASE_URL must be set in production.")
            if "*" in self.CORS_ORIGINS:
                raise RuntimeError("CORS_ORIGINS cannot contain '*' in production.")

    @property
    def DATABASE_URL(self) -> str:
        """
                Returns the PostgreSQL connection string supplied by Neon, Render, or local development.
        """
        url = self.DATABASE_URL_ENV or self.SUPABASE_DATABASE_URL
        if not url:
            raise RuntimeError(
                "DATABASE_URL is not set. Add the Neon connection string to the backend environment."
            )
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


settings = Settings()