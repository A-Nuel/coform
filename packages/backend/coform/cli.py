"""
Simple CLI entry point for Coform.
"""

from __future__ import annotations

import argparse
import json
import sys

from .transforms import transform_to_matrix
from .models import Rigid2DTransform, Pose2D


def main() -> None:
    parser = argparse.ArgumentParser(description="Coform CLI")
    sub = parser.add_subparsers(dest="command")

    # Example: apply a simple rigid2d
    apply_p = sub.add_parser("demo-rigid2d", help="Demo rigid 2D transform")
    apply_p.add_argument("--tx", type=float, default=10.0)
    apply_p.add_argument("--ty", type=float, default=5.0)
    apply_p.add_argument("--theta", type=float, default=0.5)

    args = parser.parse_args()

    if args.command == "demo-rigid2d":
        t = Rigid2DTransform(
            type="rigid2d",
            pose=Pose2D(translation=[args.tx, args.ty], rotation=args.theta),
        )
        M = transform_to_matrix(t)
        print(json.dumps(M.tolist(), indent=2))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
