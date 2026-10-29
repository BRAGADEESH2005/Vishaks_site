"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ATMOSPHERES, sunDirection, type AtmosphereId } from "@/lib/three/atmosphere";

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 belt;
  uniform vec3 ground;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float beltStrength;
  uniform float glow;
  varying vec3 vDir;
  // Mix in gamma space so gradients look like a painted sky, not a linear fade.
  vec3 gmix(vec3 a, vec3 b, float t) {
    return pow(mix(pow(a, vec3(1.0 / 2.2)), pow(b, vec3(1.0 / 2.2)), t), vec3(2.2));
  }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = gmix(horizon, zenith, pow(smoothstep(0.0, 0.62, h), 0.7));
    // Anti-twilight band on the side away from the sun.
    float away = clamp(dot(normalize(vec3(d.x, 0.0, d.z)), -normalize(vec3(sunDir.x, 0.0, sunDir.z))) * 0.5 + 0.5, 0.0, 1.0);
    float band = exp(-pow((h - 0.07) / 0.07, 2.0)) * beltStrength * away;
    col = gmix(col, belt, band);
    // Glow around the sun.
    float s = max(dot(d, normalize(sunDir)), 0.0);
    col += sunColor * (pow(s, 8.0) * 0.35 + pow(s, 64.0) * 0.6) * glow;
    // Below the horizon fade to the ground haze.
    col = mix(col, ground, 1.0 - smoothstep(-0.08, 0.0, h));
    // Gentle dither to avoid banding in gradients.
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export type ShadowFrame = { extent: number; target?: [number, number, number]; distance?: number; mapSize?: number };

export function Atmosphere({ preset, shadow }: { preset: AtmosphereId; shadow: ShadowFrame }) {
  const a = ATMOSPHERES[preset];
  const sun = useRef<THREE.DirectionalLight>(null);
  const dir = useMemo(() => sunDirection(a.sun.azimuth, a.sun.elevation), [a.sun.azimuth, a.sun.elevation]);

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: new THREE.Color(a.sky.zenith) },
          horizon: { value: new THREE.Color(a.sky.horizon) },
          belt: { value: new THREE.Color(a.sky.belt) },
          ground: { value: new THREE.Color(a.sky.ground) },
          sunDir: { value: new THREE.Vector3(...dir) },
          sunColor: { value: new THREE.Color(a.sun.color) },
          beltStrength: { value: a.sky.beltStrength },
          glow: { value: a.sky.glow },
        },
      }),
    [a, dir],
  );
  useEffect(() => () => skyMaterial.dispose(), [skyMaterial]);

  // React Three Fiber already uses ACES Filmic tone mapping; only exposure varies.
  useFrame(({ gl }) => {
    gl.toneMappingExposure = a.exposure;
  });

  const target = useMemo(() => new THREE.Object3D(), []);
  const t = useMemo<[number, number, number]>(() => shadow.target ?? [0, 0, 0], [shadow.target]);
  const dist = shadow.distance ?? 600;

  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    target.position.set(...t);
    light.target = target;
    const cam = light.shadow.camera;
    cam.left = -shadow.extent;
    cam.right = shadow.extent;
    cam.top = shadow.extent;
    cam.bottom = -shadow.extent;
    cam.near = 1;
    cam.far = dist * 2;
    cam.updateProjectionMatrix();
    // Scale the bias with the shadow frustum so low sun angles stay free of acne.
    light.shadow.bias = -0.0006;
    light.shadow.normalBias = Math.max(0.6, shadow.extent / 140);
  }, [shadow.extent, dist, t, target]);

  return (
    <>
      <mesh material={skyMaterial} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[4000, 48, 24]} />
      </mesh>
      <fogExp2 attach="fog" args={[a.fog.color, a.fog.density]} />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        castShadow
        color={a.sun.color}
        intensity={a.sun.intensity}
        position={[t[0] + dir[0] * dist, t[1] + dir[1] * dist + 40, t[2] + dir[2] * dist]}
        shadow-mapSize-width={shadow.mapSize ?? 2048}
        shadow-mapSize-height={shadow.mapSize ?? 2048}
      />
      <hemisphereLight args={[a.hemi.sky, a.hemi.ground, a.hemi.intensity]} />
      {/* Reflections only: an environment of soft light panels matched to the sky. */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={[a.sky.zenith]} />
        <Lightformer form="rect" intensity={a.env.cool} color={a.sky.zenith} position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
        {/* The afterglow: a tall, soft warm wash on the sun side, brightest at the horizon. */}
        <Lightformer
          form="rect"
          intensity={a.env.warm * 0.45}
          color={a.sky.horizon}
          position={[dir[0] * 40, 16, dir[2] * 40]}
          scale={[110, 34, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={a.env.warm}
          color={a.sun.color}
          position={[dir[0] * 40, 4, dir[2] * 40]}
          scale={[90, 7, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={a.env.cool * 1.2}
          color={a.sky.belt}
          position={[-dir[0] * 40, 5, -dir[2] * 40]}
          scale={[90, 9, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer form="rect" intensity={0.6} color={a.sky.ground} position={[0, -20, 0]} rotation-x={-Math.PI / 2} scale={[80, 80, 1]} />
      </Environment>
    </>
  );
}
