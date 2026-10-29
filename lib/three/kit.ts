import * as THREE from "three";
import { makeFrondAlpha, makeGroundTexture, makeRippleNormal, makeStoneTexture } from "./textures";

/**
 * The shared material library for every procedural scene. Created once per
 * scene and disposed with it.
 */
export type Kit = {
  concrete: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  balustrade: THREE.MeshPhysicalMaterial;
  water: THREE.MeshPhysicalMaterial;
  pool: THREE.MeshPhysicalMaterial;
  paving: THREE.MeshStandardMaterial;
  asphalt: THREE.MeshStandardMaterial;
  lawn: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  trunk: THREE.MeshStandardMaterial;
  frond: THREE.MeshStandardMaterial;
  warmLight: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  textures: THREE.Texture[];
};

export function createKit(): Kit {
  const stoneTex = makeStoneTexture(7);
  stoneTex.repeat.set(4, 2);
  const pavingTex = makeGroundTexture(21, [170, 160, 146], 18);
  pavingTex.repeat.set(10, 10);
  const groundTex = makeGroundTexture(5, [70, 62, 52], 26);
  groundTex.repeat.set(60, 60);
  const lawnTex = makeGroundTexture(9, [74, 86, 52], 30);
  lawnTex.repeat.set(8, 8);
  const asphaltTex = makeGroundTexture(13, [48, 46, 44], 20);
  asphaltTex.repeat.set(30, 30);
  const ripple = makeRippleNormal(3);
  ripple.repeat.set(40, 40);
  const poolRipple = makeRippleNormal(8);
  poolRipple.repeat.set(4, 4);
  const frondAlpha = makeFrondAlpha();

  const kit: Kit = {
    concrete: new THREE.MeshStandardMaterial({ color: "#e6dfd3", roughness: 0.78, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ color: "#ffffff", map: stoneTex, roughness: 0.62, metalness: 0 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#8a6440", roughness: 0.36, metalness: 0.85 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: "#26211d", roughness: 0.45, metalness: 0.7 }),
    balustrade: new THREE.MeshPhysicalMaterial({
      color: "#9fb2b5",
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: "#1c2a33",
      roughness: 0.16,
      metalness: 0.1,
      normalMap: ripple,
      normalScale: new THREE.Vector2(0.35, 0.35),
      envMapIntensity: 1.1,
    }),
    pool: new THREE.MeshPhysicalMaterial({
      color: "#2e6670",
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      normalMap: poolRipple,
      normalScale: new THREE.Vector2(0.2, 0.2),
      emissive: "#0d3d45",
      emissiveIntensity: 0.6,
    }),
    paving: new THREE.MeshStandardMaterial({ map: pavingTex, color: "#ffffff", roughness: 0.85 }),
    asphalt: new THREE.MeshStandardMaterial({ map: asphaltTex, color: "#ffffff", roughness: 0.9 }),
    lawn: new THREE.MeshStandardMaterial({ map: lawnTex, color: "#ffffff", roughness: 0.95 }),
    soil: new THREE.MeshStandardMaterial({ color: "#8a6a4c", roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, metalness: 0 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#5a4636", roughness: 0.95 }),
    frond: new THREE.MeshStandardMaterial({
      color: "#4d5a2c",
      alphaMap: frondAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.85,
    }),
    warmLight: new THREE.MeshStandardMaterial({ color: "#2a1a0c", emissive: "#ffb76b", emissiveIntensity: 2.2 }),
    ground: new THREE.MeshStandardMaterial({ map: groundTex, color: "#ffffff", roughness: 1 }),
    textures: [stoneTex, pavingTex, groundTex, lawnTex, asphaltTex, ripple, poolRipple, frondAlpha],
  };
  return kit;
}

export function disposeKit(kit: Kit) {
  for (const value of Object.values(kit)) {
    if (value instanceof THREE.Material) value.dispose();
  }
  kit.textures.forEach((t) => t.dispose());
}

/** Free all GPU resources under an object that was built procedurally. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
  });
}
