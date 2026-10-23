import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";

test("process copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "process.title"), "Built with Purpose. Crafted to Perfection.");
  assert.equal(tFor("vi", "process.title"), "Built with Purpose. Crafted to Perfection.");
  assert.equal(tFor("en", "process.stages.craft.title"), "The Craft");
  assert.equal(tFor("en", "process.stages.wood.title"), "Wood Selection & Preparation");
  assert.equal(
    tFor("en", "process.stages.wood.tagline"),
    "Natural beauty. Careful preparation. Stability by design.",
  );
  assert.equal(tFor("en", "process.stages.construction.title"), "Design & Construction");
  assert.equal(tFor("en", "process.stages.finish.title"), "Finish & Detail");
  assert.equal(tFor("en", "process.stages.setup.title"), "Assembly & Setup");
  assert.equal(tFor("en", "process.stages.delivery.title"), "Final Inspection & Delivery");
  assert.equal(tFor("vi", "process.stages.wood.title"), "Lựa chọn và xử lý gỗ");
  assert.equal(tFor("vi", "process.stages.wood.body")[0], "Với chúng tôi, một cây đàn tốt bắt đầu từ những tấm gỗ tốt.");
  assert.equal(tFor("en", "process.cta.button"), "Start a Custom Build");
  assert.equal(tFor("en", "nav.buildProcess"), "Build Process");
  assert.equal(tFor("vi", "nav.buildProcess"), "Quy trình");
});
