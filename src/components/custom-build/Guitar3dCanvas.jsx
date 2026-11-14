import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  Box3,
  Color,
  LinearSRGBColorSpace,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";
import {
  DEFAULT_3D_CAMERA,
  GUITAR_3D_SLOTS,
  assignMeshesToSlots,
  guitar3dMaterialSignature,
} from "../../data/wizardGuitar3d.js";

const WOOD_SLOTS = new Set(["body", "top", "neck", "fretboard", "headstock"]);
const COLOR_MAPS = new Set(["map"]);

function poseForSide(side, camera) {
  const poses = camera || DEFAULT_3D_CAMERA;
  return side === "back" ? poses.back : poses.front;
}

function CameraRig({ side, resetNonce, cameraPoses }) {
  const { camera, controls } = useThree();
  useLayoutEffect(() => {
    const pose = poseForSide(side, cameraPoses);
    camera.position.set(...pose.position);
    camera.near = 0.05;
    camera.far = 40;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(...pose.target);
      controls.update();
    } else {
      camera.lookAt(...pose.target);
    }
  }, [camera, controls, side, resetNonce, cameraPoses]);
  return null;
}

function useTextureMap(urls) {
  const [textures, setTextures] = useState({});
  const key = JSON.stringify(urls || {});
  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();
    const next = {};
    const pending = [];
    const entries = Object.entries(urls || {}).filter(([, url]) => Boolean(url));
    for (const [slotKey, url] of entries) {
      pending.push(
        new Promise((resolve) => {
          loader.load(
            url,
            (texture) => {
              texture.wrapS = RepeatWrapping;
              texture.wrapT = RepeatWrapping;
              texture.colorSpace = COLOR_MAPS.has(slotKey) ? SRGBColorSpace : LinearSRGBColorSpace;
              texture.anisotropy = 4;
              next[slotKey] = texture;
              resolve();
            },
            undefined,
            () => resolve(),
          );
        }),
      );
    }
    Promise.all(pending).then(() => {
      if (!cancelled) setTextures(next);
    });
    return () => {
      cancelled = true;
      for (const texture of Object.values(next)) {
        texture.dispose?.();
      }
    };
  }, [key]);
  return textures;
}

function collectMapUrls(materials) {
  const urls = {};
  for (const slot of GUITAR_3D_SLOTS) {
    const maps = materials?.[slot]?.maps;
    if (!maps) continue;
    for (const [mapKey, url] of Object.entries(maps)) {
      if (url) urls[`${slot}:${mapKey}`] = url;
    }
  }
  return urls;
}

function toPhysical(source) {
  const mat = new MeshPhysicalMaterial();
  if (!source) return mat;
  if (source.color) mat.color.copy(source.color);
  mat.map = source.map || null;
  mat.normalMap = source.normalMap || null;
  mat.roughnessMap = source.roughnessMap || null;
  mat.metalnessMap = source.metalnessMap || null;
  mat.aoMap = source.aoMap || null;
  mat.metalness = typeof source.metalness === "number" ? source.metalness : 0;
  mat.roughness = typeof source.roughness === "number" ? source.roughness : 0.45;
  mat.envMapIntensity = source.envMapIntensity ?? 0.85;
  return mat;
}

function applyIntent(material, slot, materials, textures) {
  const intent = materials?.[slot];
  const finish = materials?.finish;
  if (intent?.applied && intent.maps) {
    if (intent.maps.map) material.map = textures[`${slot}:map`] || material.map;
    if (intent.maps.normalMap) material.normalMap = textures[`${slot}:normalMap`] || material.normalMap;
    if (intent.maps.roughnessMap) {
      material.roughnessMap = textures[`${slot}:roughnessMap`] || material.roughnessMap;
    }
    if (intent.maps.metalnessMap) {
      material.metalnessMap = textures[`${slot}:metalnessMap`] || material.metalnessMap;
    }
    if (intent.maps.aoMap) material.aoMap = textures[`${slot}:aoMap`] || material.aoMap;
    const repeat = intent.uvRepeat;
    if (Array.isArray(repeat) && material.map) {
      material.map.repeat.set(repeat[0] || 1, repeat[1] || 1);
    }
  }
  if (WOOD_SLOTS.has(slot) && finish?.color && /^#/i.test(finish.color)) {
    material.color = new Color(finish.color);
  }
  if (WOOD_SLOTS.has(slot) && finish?.sheenPreset) {
    material.roughness = finish.sheenPreset.roughness;
    material.clearcoat = finish.sheenPreset.clearcoat;
    material.clearcoatRoughness = finish.sheenPreset.clearcoatRoughness;
    material.metalness = 0;
  }
  if (!WOOD_SLOTS.has(slot) && intent?.applied) {
    if (intent.color && /^#/i.test(intent.color)) material.color = new Color(intent.color);
    if (typeof intent.metalness === "number") material.metalness = intent.metalness;
    if (typeof intent.roughness === "number") material.roughness = intent.roughness;
  }
  material.needsUpdate = true;
}

function GuitarModel({ model, materials }) {
  const invalidate = useThree((state) => state.invalidate);
  const gltf = useGLTF(model.url);
  const textures = useTextureMap(collectMapUrls(materials));
  const signature = guitar3dMaterialSignature(materials);
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    clone.position.sub(center);
    const longest = Math.max(size.x, size.y, size.z, 0.0001);
    clone.scale.setScalar(1.7 / longest);
  }, [clone]);

  useLayoutEffect(() => {
    const names = [];
    clone.traverse((child) => {
      if (child.isMesh) names.push(child.name);
    });
    const assigned = assignMeshesToSlots(names, model.meshes);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      const slot = GUITAR_3D_SLOTS.find((key) => assigned[key].includes(child.name));
      if (!slot) return;
      const next = toPhysical(Array.isArray(child.material) ? child.material[0] : child.material);
      applyIntent(next, slot, materials, textures);
      child.material = next;
    });
    invalidate();
  }, [clone, model.meshes, materials, textures, signature, invalidate]);

  return <primitive object={clone} />;
}

function StudioLights() {
  return (
    <>
      <hemisphereLight args={["#f3ead8", "#1a1612", 0.55]} />
      <directionalLight position={[2.4, 3.2, 2.1]} intensity={1.35} color="#fff4e5" />
      <directionalLight position={[-2.2, 1.4, 1.2]} intensity={0.35} color="#9bb7ff" />
      <directionalLight position={[0.2, 1.6, -2.4]} intensity={0.45} color="#ffe8c8" />
    </>
  );
}

export default function Guitar3dCanvas({ scene, side, onResetReady }) {
  const controlsRef = useRef(null);
  const [resetNonce, setResetNonce] = useState(0);
  const cameraPoses = scene.model?.camera || DEFAULT_3D_CAMERA;

  useEffect(() => {
    onResetReady?.(() => setResetNonce((value) => value + 1));
    return () => onResetReady?.(null);
  }, [onResetReady]);

  return (
    <Canvas
      className="absolute inset-0 h-full w-full touch-none"
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{ fov: 32, position: poseForSide(side, cameraPoses).position, near: 0.05, far: 40 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0c0c0c", 1);
      }}
    >
      <StudioLights />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.15}
        maxDistance={3.2}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.62}
        rotateSpeed={0.72}
        zoomSpeed={0.7}
      />
      <GuitarModel model={scene.model} materials={scene.materials} />
      <CameraRig side={side} resetNonce={resetNonce} cameraPoses={cameraPoses} />
    </Canvas>
  );
}
