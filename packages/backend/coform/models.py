"""
Pydantic models mirroring @coform/core types.
These are the contract between frontend and the high-accuracy Python backend.
"""

from __future__ import annotations

from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class Pose2D(BaseModel):
    translation: list[float] = Field(..., min_length=2, max_length=2)
    rotation: float  # radians
    scale: Optional[float] = 1.0


class Pose3D(BaseModel):
    translation: list[float] = Field(..., min_length=3, max_length=3)
    rotation: list[float] = Field(..., min_length=4, max_length=4)  # quaternion [x,y,z,w]
    scale: Optional[float] = 1.0


class TransformBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: Optional[str] = None
    type: str
    parent_frame: Optional[str] = Field(None, alias="parentFrame")
    child_frame: Optional[str] = Field(None, alias="childFrame")


class Rigid2DTransform(TransformBase):
    type: Literal["rigid2d"] = "rigid2d"
    pose: Pose2D


class Similarity2DTransform(TransformBase):
    type: Literal["similarity2d"] = "similarity2d"
    pose: Pose2D


class Rigid3DTransform(TransformBase):
    type: Literal["rigid3d"] = "rigid3d"
    pose: Pose3D


class Similarity3DTransform(TransformBase):
    type: Literal["similarity3d"] = "similarity3d"
    pose: Pose3D


class Affine2DTransform(TransformBase):
    type: Literal["affine2d"] = "affine2d"
    matrix: list[list[float]]


class HomographyTransform(TransformBase):
    type: Literal["homography"] = "homography"
    matrix: list[list[float]]


class SE3Transform(TransformBase):
    type: Literal["se3"] = "se3"
    matrix: list[list[float]]


Transform = Union[
    Rigid2DTransform,
    Similarity2DTransform,
    Rigid3DTransform,
    Similarity3DTransform,
    Affine2DTransform,
    HomographyTransform,
    SE3Transform,
]


class CoordinateSet(BaseModel):
    id: str
    dim: Literal[2, 3]
    points: list[list[float]]
    frame_id: Optional[str] = Field(None, alias="frameId")
    covariances: Optional[list[list[list[float]]]] = None
    metadata: Optional[dict[str, Any]] = None


class ImageData(BaseModel):
    id: str
    data: str  # base64
    width: int
    height: int
    format: Literal["png", "jpg", "webp", "jpeg"]
    associated_coords: Optional[CoordinateSet] = Field(None, alias="associatedCoords")
    metadata: Optional[dict[str, Any]] = None


class ApplyTransformRequest(BaseModel):
    transform: Transform
    coordinates: Optional[CoordinateSet] = None
    image: Optional[ImageData] = None


class ApplyTransformResponse(BaseModel):
    coordinates: Optional[CoordinateSet] = None
    image: Optional[ImageData] = None
    transform_matrix: Optional[list[list[float]]] = Field(None, alias="transformMatrix")


class ComposeRequest(BaseModel):
    transforms: list[Transform]


class ComposeResponse(BaseModel):
    result: Transform
    matrix: list[list[float]]


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
