
import dlib
import face_recognition_models
import numpy as np
from ultralytics import YOLO

from app.config import settings


_face_detector_model = None


# Load the 68-point facial landmark model
_shape_predictor = dlib.shape_predictor(
    face_recognition_models.pose_predictor_model_location()
)


# Load the face recognition model that generates 128-D face encodings
_face_encoder = dlib.face_recognition_model_v1(
    face_recognition_models.face_recognition_model_location()
)


def face_locations(image, model="hog"):
    """
    Detect faces and return locations in the format:

    (top, right, bottom, left)
    """

    global _face_detector_model
    if _face_detector_model is None:
        _face_detector_model = YOLO(settings.YOLO_FACE_MODEL)

    results = _face_detector_model.predict(
        source=image,
        conf=settings.YOLO_FACE_CONFIDENCE,
        imgsz=settings.YOLO_FACE_IMAGE_SIZE,
        verbose=False,
    )

    locations = []

    height, width = image.shape[:2]
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes.xyxy.cpu().numpy():
            left, top, right, bottom = box.tolist()
            top = max(0, min(height - 1, int(round(top))))
            right = max(0, min(width - 1, int(round(right))))
            bottom = max(0, min(height - 1, int(round(bottom))))
            left = max(0, min(width - 1, int(round(left))))

            if right <= left or bottom <= top:
                continue

            locations.append((top, right, bottom, left))

    return locations


def _location_to_dlib_rectangle(location):
    top, right, bottom, left = location

    return dlib.rectangle(
        left,
        top,
        right,
        bottom
    )


def face_encodings(image, known_face_locations=None):
    """
    Generate 128-dimensional face encodings.
    """

    if known_face_locations is None:
        known_face_locations = face_locations(image)

    encodings = []

    for location in known_face_locations:

        face_rect = _location_to_dlib_rectangle(location)

        # Get facial landmarks
        shape = _shape_predictor(image, face_rect)

        # Generate 128-D face encoding
        encoding = _face_encoder.compute_face_descriptor(
            image,
            shape
        )

        # Convert dlib vector to numpy array
        encoding = np.asarray(encoding, dtype=np.float64)

        encodings.append(encoding)

    return encodings


def face_distance(known_encodings, face_encoding):
    """
    Calculate Euclidean distance between one face encoding
    and all known face encodings.
    """

    if len(known_encodings) == 0:
        return np.empty((0,))

    known_encodings = np.asarray(
        known_encodings,
        dtype=np.float64
    )

    face_encoding = np.asarray(
        face_encoding,
        dtype=np.float64
    )

    return np.linalg.norm(
        known_encodings - face_encoding,
        axis=1
    )