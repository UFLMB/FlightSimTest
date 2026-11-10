import * as THREE from "three";

/** Load a locally hosted PBR map. Node-based tests keep procedural fallback materials. */
export function loadSurfaceTexture(file, repeatX = 1, repeatY = 1, colorSpace = THREE.NoColorSpace) {
  if (typeof document === "undefined") return null;
  const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/textures/${file}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}
