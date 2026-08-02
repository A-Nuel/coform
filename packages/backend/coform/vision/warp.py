"""
Image warping under geometric transforms.
"""

from __future__ import annotations

import base64
import io
from typing import Tuple

import cv2
import numpy as np
from PIL import Image


def decode_image(b64: str, fmt: str) -> np.ndarray:
    """Decode base64 image to BGR numpy array."""
    data = base64.b64decode(b64)
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        # Fallback via Pillow
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    return img


def encode_image(img: np.ndarray, fmt: str = "png") -> Tuple[str, int, int]:
    """Encode BGR image to base64 + dimensions."""
    ext = f".{fmt.lower()}"
    if fmt.lower() in ("jpg", "jpeg"):
        ext = ".jpg"
    success, buf = cv2.imencode(ext, img)
    if not success:
        raise RuntimeError("Failed to encode image")
    b64 = base64.b64encode(buf.tobytes()).decode("ascii")
    h, w = img.shape[:2]
    return b64, w, h


def warp_image(
    image_b64: str,
    fmt: str,
    matrix: np.ndarray,
    output_size: Tuple[int, int] | None = None,
) -> Tuple[str, int, int]:
    """
    Warp an image with a 3x3 matrix (affine or homography).
    Returns (base64, width, height).
    """
    img = decode_image(image_b64, fmt)
    h, w = img.shape[:2]
    if output_size is None:
        output_size = (w, h)

    # Decide between affine and perspective
    if np.allclose(matrix[2], [0, 0, 1], atol=1e-6):
        # Affine
        M = matrix[:2, :]
        warped = cv2.warpAffine(img, M, output_size, flags=cv2.INTER_LINEAR)
    else:
        warped = cv2.warpPerspective(img, matrix, output_size, flags=cv2.INTER_LINEAR)

    return encode_image(warped, fmt)
