import React, { useMemo } from "react";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

interface CustomGLBModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  ghost?: boolean;
  opacity?: number;
  matrix4x4?: number[][];
}

export const CustomGLBModel: React.FC<CustomGLBModelProps> = ({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  ghost = false,
  opacity = 1,
  matrix4x4,
}) => {
  const { scene } = useGLTF(url);

  // Clone scene so multiple instances (ghost vs active) don't collide
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    if (ghost) {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = new THREE.MeshStandardMaterial({
            color: "#64748b",
            transparent: true,
            opacity: opacity || 0.35,
            wireframe: false,
          });
        }
      });
    }

    return clone;
  }, [scene, ghost, opacity]);

  const transformMatrix = useMemo(() => {
    if (!matrix4x4) return null;
    const mat = new THREE.Matrix4();
    // matrix4x4 is row-major 4x4 array
    mat.set(
      matrix4x4[0][0], matrix4x4[0][1], matrix4x4[0][2], matrix4x4[0][3],
      matrix4x4[1][0], matrix4x4[1][1], matrix4x4[1][2], matrix4x4[1][3],
      matrix4x4[2][0], matrix4x4[2][1], matrix4x4[2][2], matrix4x4[2][3],
      matrix4x4[3][0], matrix4x4[3][1], matrix4x4[3][2], matrix4x4[3][3]
    );
    return mat;
  }, [matrix4x4]);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {transformMatrix ? (
        <group matrixAutoUpdate={false} matrix={transformMatrix}>
          <Center top>
            <primitive object={clonedScene} />
          </Center>
        </group>
      ) : (
        <Center top>
          <primitive object={clonedScene} />
        </Center>
      )}
    </group>
  );
};
