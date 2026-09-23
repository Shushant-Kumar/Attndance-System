"""
Low-level face processing helpers shared by face_registration.py (Phase 3)
and recognition.py (Phase 4).

Uses:
- OpenCV (cv2)      -> image decoding / disk I/O
- face_recognition  -> HOG/CNN face detection + 128-d encodings (dlib under the hood)
"""
import base64
import io
import json
import os
import re
from typing import Optional

import numpy as np
import cv2
from app.utils import face_recognition
from app.config import settings


class NoFaceDetected(Exception):
    pass


class MultipleFacesDetected(Exception):
    pass


def decode_base64_image(data_url: str) -> np.ndarray:
    """
    Accepts a data URL like 'data:image/jpeg;base64,/9j/4AAQ...' (what a
    <canvas>.toDataURL() call in the browser produces) and returns an
    RGB numpy array suitable for face_recognition.
    """
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]

    img_bytes = base64.b64decode(data_url)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    bgr_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if bgr_image is None:
        raise ValueError("Could not decode image data")

    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    return rgb_image


def detect_single_face_encoding(rgb_image: np.ndarray) -> tuple[np.ndarray, tuple]:
    """
    Detects faces in the image and returns (128-d encoding, bounding box)
    for exactly one face. Raises NoFaceDetected / MultipleFacesDetected
    otherwise, so the caller can send a clear message back to the UI.
    """
    # 'hog' model = CPU-friendly, good enough for a controlled registration
    # capture where the student is centered and looking at the camera.
    face_locations = face_recognition.face_locations(rgb_image, model="hog")

    if len(face_locations) == 0:
        raise NoFaceDetected("No face detected. Make sure your face is clearly visible.")
    if len(face_locations) > 1:
        raise MultipleFacesDetected(
            "Multiple faces detected. Only one person should be in frame."
        )

    encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)
    return encodings[0], face_locations[0]


def save_capture_image(rgb_image: np.ndarray, student_id: int, capture_index: int) -> str:
    """
    Saves the captured frame to dataset/<student_id>/<index>.jpg
    and returns the relative path stored in the DB.
    """
    student_dir = os.path.join(settings.FACE_DATASET_DIR, str(student_id))
    os.makedirs(student_dir, exist_ok=True)

    filename = f"{capture_index:02d}.jpg"
    filepath = os.path.join(student_dir, filename)

    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    cv2.imwrite(filepath, bgr_image)

    return os.path.join(str(student_id), filename)


def encoding_to_json(encoding: np.ndarray) -> str:
    return json.dumps(encoding.tolist())


def encoding_from_json(encoding_json: str) -> np.ndarray:
    return np.array(json.loads(encoding_json))


def average_encodings(encodings: list[np.ndarray]) -> np.ndarray:
    """
    Combines every captured encoding for a student into a single
    representative 128-d vector (simple mean — robust enough given
    20-30 varied-angle/lighting samples).
    """
    stacked = np.stack(encodings, axis=0)
    return np.mean(stacked, axis=0)


def detect_all_faces(rgb_image: np.ndarray) -> list[tuple[np.ndarray, tuple]]:
    """
    Used by the recognition engine (Phase 4), unlike detect_single_face_encoding
    which is used during registration and enforces exactly one face.
    Returns a list of (encoding, (top, right, bottom, left)) for every face found.
    """
    face_locations = face_recognition.face_locations(rgb_image, model="hog")
    if not face_locations:
        return []
    encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)
    return list(zip(encodings, face_locations))


def delete_student_dataset_dir(student_id: int) -> None:
    student_dir = os.path.join(settings.FACE_DATASET_DIR, str(student_id))
    if os.path.isdir(student_dir):
        for f in os.listdir(student_dir):
            try:
                os.remove(os.path.join(student_dir, f))
            except OSError:
                pass
        try:
            os.rmdir(student_dir)
        except OSError:
            pass
