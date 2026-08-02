"""
FastAPI routes for Coform.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from fastapi import APIRouter, HTTPException

from ..models import (
    ApplyTransformRequest,
    ApplyTransformResponse,
    ComposeRequest,
    ComposeResponse,
    CoordinateSet,
    HealthResponse,
    ImageData,
    SE3Transform,
    HomographyTransform,
)
from ..transforms import (
    transform_to_matrix,
    compose_transforms,
    apply_se2,
    apply_se3,
    apply_affine2d,
    apply_homography,
)
from ..vision import warp_image

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@router.post("/transforms/apply", response_model=ApplyTransformResponse)
def apply_transform(req: ApplyTransformRequest) -> ApplyTransformResponse:
    try:
        matrix = transform_to_matrix(req.transform)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    resp = ApplyTransformResponse(transform_matrix=matrix.tolist())

    if req.coordinates is not None:
        pts = np.asarray(req.coordinates.points, dtype=np.float64)
        dim = req.coordinates.dim

        if dim == 2:
            if matrix.shape == (3, 3):
                if np.allclose(matrix[2], [0, 0, 1], atol=1e-6):
                    out = apply_affine2d(matrix, pts)
                else:
                    out = apply_homography(matrix, pts)
            else:
                raise HTTPException(status_code=400, detail="Matrix shape incompatible with 2D points")
        else:
            if matrix.shape == (4, 4):
                out = apply_se3(matrix, pts)
            else:
                raise HTTPException(status_code=400, detail="Matrix shape incompatible with 3D points")

        resp.coordinates = CoordinateSet(
            id=f"{req.coordinates.id}_transformed",
            dim=dim,
            points=out.tolist(),
            frame_id=req.transform.child_frame or req.coordinates.frame_id,
            metadata=req.coordinates.metadata,
        )

    if req.image is not None:
        if matrix.shape != (3, 3):
            raise HTTPException(
                status_code=400,
                detail="Image warping currently supports only 3x3 matrices (affine/homography)",
            )
        try:
            b64, w, h = warp_image(
                req.image.data,
                req.image.format,
                matrix,
            )
            resp.image = ImageData(
                id=f"{req.image.id}_warped",
                data=b64,
                width=w,
                height=h,
                format=req.image.format,
                associated_coords=resp.coordinates,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Warp failed: {e}") from e

    return resp


@router.post("/transforms/compose", response_model=ComposeResponse)
def compose(req: ComposeRequest) -> ComposeResponse:
    try:
        matrix, inferred_type = compose_transforms(req.transforms)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if inferred_type == "se3":
        result: Any = SE3Transform(
            type="se3",
            matrix=matrix.tolist(),
            parent_frame=req.transforms[0].parent_frame if req.transforms else None,
            child_frame=req.transforms[-1].child_frame if req.transforms else None,
        )
    else:
        result = HomographyTransform(
            type="homography",
            matrix=matrix.tolist(),
            parent_frame=req.transforms[0].parent_frame if req.transforms else None,
            child_frame=req.transforms[-1].child_frame if req.transforms else None,
        )

    return ComposeResponse(result=result, matrix=matrix.tolist())
