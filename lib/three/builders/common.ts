import * as THREE from "three";

export type Placement = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  color?: THREE.ColorRepresentation;
};

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

/** One draw call for many copies of the same geometry. */
export function instanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placements: Placement[],
  opts: { cast?: boolean; receive?: boolean; name?: string } = {},
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, placements.length));
  mesh.count = placements.length;
  placements.forEach((p, i) => {
    tmpObj.position.set(...p.position);
    tmpObj.rotation.set(...(p.rotation ?? [0, 0, 0]));
    const s = p.scale ?? 1;
    if (typeof s === "number") tmpObj.scale.setScalar(s);
    else tmpObj.scale.set(...s);
    tmpObj.updateMatrix();
    mesh.setMatrixAt(i, tmpObj.matrix);
    if (p.color !== undefined) mesh.setColorAt(i, tmpColor.set(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.name) mesh.name = opts.name;
  mesh.computeBoundingSphere();
  return mesh;
}

export function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  position: [number, number, number],
  opts: { cast?: boolean; receive?: boolean } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(...position);
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

/** Rescale a box geometry's UVs so a repeating texture keeps a fixed world size. */
export function worldUVBox(w: number, h: number, d: number, tileW: number, tileH: number, offset: [number, number] = [0, 0]) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  const faces: Array<[number, number] | null> = [
    [d / tileW, h / tileH],
    [d / tileW, h / tileH],
    null,
    null,
    [w / tileW, h / tileH],
    [w / tileW, h / tileH],
  ];
  faces.forEach((scale, f) => {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      if (!scale) uv.setXY(i, 0.02, 0.02);
      else uv.setXY(i, uv.getX(i) * scale[0] + offset[0], uv.getY(i) * scale[1] + offset[1]);
    }
  });
  uv.needsUpdate = true;
  return g;
}

/** Ground-plane helper: a horizontal plane lying on y. */
export function flat(w: number, d: number, material: THREE.Material, position: [number, number, number], receive = true) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(...position);
  m.receiveShadow = receive;
  return m;
}
