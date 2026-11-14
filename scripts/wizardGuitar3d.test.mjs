import assert from "node:assert/strict";
import test from "node:test";
import {
  assignMeshesToSlots,
  guitar3dSrc,
  matchModelForShape,
  meshNameMatches,
  optionLooksLikeNone,
  optionModelUrl,
  resolveGuitar3d,
  resolveGuitar3dMaterials,
  WIZARD_GUITAR_3D_ASSET_SPEC,
  WIZARD_GUITAR_3D_MODELS,
  WIZARD_GUITAR_3D_WOODS,
} from "../src/data/wizardGuitar3d.js";

const models = [
  {
    id: "modern-double-cutaway",
    shapeKeys: ["modern-double-cutaway", "mdc"],
    url: "/models/guitars/modern-double-cutaway/model.glb",
    meshes: { body: ["Body"], top: ["Top"], neck: ["Neck"] },
  },
];

const woods = [
  {
    id: "alder",
    optionKeys: ["alder"],
    map: "/textures/wood/alder/albedo.jpg",
    normalMap: "/textures/wood/alder/normal.jpg",
    roughnessMap: "/textures/wood/alder/roughness.jpg",
  },
  {
    id: "flamed-maple",
    optionKeys: ["flamed-maple", "maple-flame"],
    map: "/textures/wood/flamed-maple/albedo.jpg",
  },
];

const hardware = [
  {
    id: "black",
    optionKeys: ["black"],
    color: "#1a1a1a",
    metalness: 0.85,
    roughness: 0.35,
  },
];

test("repo has no registered 3D models or wood PBR maps yet", () => {
  assert.equal(WIZARD_GUITAR_3D_MODELS.length, 0);
  assert.equal(WIZARD_GUITAR_3D_WOODS.length, 0);
  assert.equal(WIZARD_GUITAR_3D_ASSET_SPEC.missingInRepo.glb, true);
});

test("without a mapped GLB the preview stays on the 2D fallback", () => {
  const resolved = resolveGuitar3d({
    shape: { id: "modern-double-cutaway", name: "Modern Double Cutaway" },
    bodyWood: { id: "alder", name: "Alder" },
  });
  assert.equal(resolved.mode, "fallback-2d");
  assert.equal(resolved.reason, "no-model");
  assert.equal(resolved.model, null);
});

test("shape without selection does not invent a model", () => {
  const resolved = resolveGuitar3d({ bodyWood: { id: "alder" } });
  assert.equal(resolved.mode, "fallback-2d");
  assert.equal(resolved.reason, "no-shape");
});

test("registry maps a body shape to its own GLB and never another shape", () => {
  const matched = matchModelForShape({ id: "modern-double-cutaway" }, models);
  assert.equal(matched.url, "/models/guitars/modern-double-cutaway/model.glb");
  const other = matchModelForShape({ id: "single-cutaway" }, models);
  assert.equal(other, null);
  const resolved = resolveGuitar3d({ shape: { id: "single-cutaway" } }, { models });
  assert.equal(resolved.mode, "fallback-2d");
});

test("embedded option modelPath is used only when it is a glTF file", () => {
  assert.equal(optionModelUrl({ attributes: { modelPath: "/uploads/shape.jpg" } }), "");
  assert.equal(
    optionModelUrl({ attributes: { modelPath: "/uploads/shapes/mdc.glb" } }),
    "/uploads/shapes/mdc.glb",
  );
  const resolved = resolveGuitar3d(
    { shape: { id: "mdc", attributes: { modelPath: "/uploads/shapes/mdc.glb" } } },
    { resolveUpload: (path) => `https://media.test${path}` },
  );
  assert.equal(resolved.mode, "model");
  assert.equal(resolved.model.source, "option");
  assert.equal(resolved.model.url, "https://media.test/uploads/shapes/mdc.glb");
});

test("wood and hardware without PBR assets do not invent materials", () => {
  const materials = resolveGuitar3dMaterials({
    bodyWood: { id: "alder", image: "/uploads/alder-photo.jpg" },
    topWood: { id: "maple", image: "/uploads/maple-photo.jpg" },
    hardwareFinish: { id: "black" },
  });
  assert.equal(materials.body.applied, false);
  assert.equal(materials.body.reason, "no-pbr-maps");
  assert.equal(materials.top.applied, false);
  assert.equal(materials.hardware.applied, false);
});

test("registered unique wood maps apply only to the matching option", () => {
  const materials = resolveGuitar3dMaterials(
    {
      bodyWood: { id: "alder" },
      topWood: { id: "quilted-maple" },
      finishType: { id: "conversion-varnish", sheen: "gloss" },
      finishColor: { id: "natural-wood", swatch: "#8b5a2b" },
    },
    woods,
    hardware,
  );
  assert.equal(materials.body.applied, true);
  assert.equal(materials.body.maps.map, "/textures/wood/alder/albedo.jpg");
  assert.equal(materials.top.applied, false);
  assert.equal(materials.finish.sheen, "gloss");
  assert.equal(materials.finish.color, "#8b5a2b");
  assert.equal(materials.finish.applied, true);
});

test("none top wood does not apply a top material", () => {
  assert.equal(optionLooksLikeNone({ id: "none", kind: "none" }), true);
  const materials = resolveGuitar3dMaterials({ topWood: { id: "none", kind: "none" } }, woods);
  assert.equal(materials.top.applied, false);
  assert.equal(materials.top.reason, "none-or-empty");
});

test("finish sheen is ignored when the catalog value has no preset", () => {
  const materials = resolveGuitar3dMaterials({
    finishType: { sheen: "unknown-coating" },
  });
  assert.equal(materials.finish.sheen, "");
  assert.equal(materials.finish.applied, false);
});

test("downstream shape change drops the previous model", () => {
  const first = resolveGuitar3d({ shape: { id: "modern-double-cutaway" } }, { models });
  assert.equal(first.mode, "model");
  const afterReset = resolveGuitar3d({ shape: null }, { models });
  assert.equal(afterReset.mode, "fallback-2d");
  const otherShape = resolveGuitar3d({ shape: { id: "headless" } }, { models });
  assert.equal(otherShape.mode, "fallback-2d");
  assert.equal(otherShape.reason, "no-model");
});

test("mesh names map to slots without substring false positives", () => {
  assert.equal(meshNameMatches("Body", ["Body"]), true);
  assert.equal(meshNameMatches("body_main", ["body"]), true);
  assert.equal(meshNameMatches("Anybody", ["body"]), false);
  const assigned = assignMeshesToSlots(
    ["Body", "Top", "Neck", "Fretboard", "Bridge", "Tuner_L"],
    {
      body: ["Body"],
      top: ["Top"],
      neck: ["Neck"],
      fretboard: ["Fretboard"],
      headstock: ["Headstock"],
      pickups: ["Pickup"],
      bridge: ["Bridge"],
      hardware: ["Tuner"],
    },
  );
  assert.deepEqual(assigned.body, ["Body"]);
  assert.deepEqual(assigned.top, ["Top"]);
  assert.deepEqual(assigned.hardware, ["Tuner_L"]);
  assert.deepEqual(assigned.pickups, []);
});

test("upload GLB paths go through the media resolver; public models do not", () => {
  assert.equal(
    guitar3dSrc("/uploads/models/a.glb", (path) => `https://media.test${path}`),
    "https://media.test/uploads/models/a.glb",
  );
  assert.equal(
    guitar3dSrc("/models/guitars/mdc/model.glb", (path) => `https://media.test${path}`),
    "/models/guitars/mdc/model.glb",
  );
});
