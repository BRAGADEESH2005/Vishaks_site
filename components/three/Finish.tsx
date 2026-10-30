"use client";

import { Bloom, EffectComposer, N8AO, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ShaderPass, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Replaces any NaN or infinite pixel, and clamps extreme highlights, before
 * bloom. A single bad pixel (from a degenerate normal at a grazing angle, for
 * example) would otherwise be spread by the bloom blur across the whole frame
 * and turn it black.
 */
function useSanitizePass() {
  const pass = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: { inputBuffer: { value: null } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = position.xy * 0.5 + 0.5;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D inputBuffer;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(inputBuffer, vUv);
          bool bad = any(isnan(c)) || any(isinf(c));
          gl_FragColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(min(c.rgb, vec3(48.0)), c.a);
        }
      `,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    return new ShaderPass(material, "inputBuffer");
  }, []);
  useEffect(() => () => pass.dispose(), [pass]);
  return pass;
}

/**
 * The camera finish shared by every live scene and the image studio:
 * ambient occlusion grounds the buildings, a restrained bloom lets lit
 * windows and lanterns glow, then filmic tone mapping, a soft vignette and
 * fine grain. "lite" drops the ambient occlusion for weaker GPUs. In daylight
 * the threshold is raised so sunlit walls do not bloom, only real light sources.
 */
export function Finish({ quality = "high", bloomThreshold = 0.92 }: { quality?: "high" | "lite"; bloomThreshold?: number }) {
  const high = quality === "high";
  const sanitize = useSanitizePass();
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <primitive object={sanitize} />
      <N8AO enabled={high} halfRes aoRadius={6} distanceFalloff={1.2} intensity={2.2} quality="medium" color="#1a120c" />
      <Bloom mipmapBlur luminanceThreshold={bloomThreshold} luminanceSmoothing={0.2} intensity={0.55} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
      <Vignette offset={0.32} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
      <Noise premultiply opacity={0.035} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  );
}
