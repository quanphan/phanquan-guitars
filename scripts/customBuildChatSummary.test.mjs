import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import { buildCustomBuildChatSummary } from "../src/services/customBuildChatSummary.js";

function named(id, name) {
  return { id, translations: { en: { name } } };
}

test("custom build chat summary includes contact, specs, woods, hardware, and reference images", () => {
  const text = buildCustomBuildChatSummary({
    language: "en",
    t: (key) => tFor("en", key),
    builder: {
      instrumentType: named("electric-guitar", "Electric Guitar"),
      series: named("solid-body", "Solid Body"),
      shape: named("offset", "Offset"),
      scale: { type: "standard", display: '25.5"' },
      radius: { display: '12"' },
      bodyWood: named("alder", "Alder"),
      topWood: named("maple-burl", "Maple burl"),
      neckWood: named("maple", "Maple"),
      neckConstruction: named("bolt-on", "Bolt-on"),
      fingerboardWood: named("rosewood", "Rosewood"),
      neckProfile: named("c", "C"),
      fretSpec: named("stainless-medium-jumbo", "Stainless medium jumbo"),
      inheritedFretCount: 22,
      pickupConfig: named("sss", "SSS"),
      pickupType: named("single-coil", "Single coil"),
      bridge: named("tremolo", "Tremolo"),
      tuner: named("locking", "Locking"),
      hardwareFinish: named("gold", "Gold"),
      controlLayout: named("vt", "Volume / tone"),
      finishType: named("nitro", "Nitro"),
      finishColor: named("olympic-white", "Olympic white"),
      inlay: named("dots", "Dots"),
      engraving: named("none", "None"),
      selections: {
        stringCount: 6,
        contactName: "Lan Pham",
        contactEmail: "lan@example.com",
        contactPhone: "0901234567",
        contactCountry: "Vietnam",
        contactMessage: "Jazzmaster feel with a tighter neck.",
        specialRequests: "Gold hardware preference",
        referenceImages: ["/uploads/custom-build/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg"],
      },
    },
  });

  assert.match(text, /Lan Pham/);
  assert.match(text, /lan@example.com/);
  assert.match(text, /0901234567/);
  assert.match(text, /Electric Guitar/);
  assert.match(text, /Solid Body/);
  assert.match(text, /Offset/);
  assert.match(text, /6 strings/);
  assert.match(text, /25\.5"/);
  assert.match(text, /Alder/);
  assert.match(text, /Maple burl/);
  assert.match(text, /Gold/);
  assert.match(text, /Nitro/);
  assert.match(text, /Jazzmaster feel with a tighter neck/);
  assert.match(text, /aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\.jpg/);
});
