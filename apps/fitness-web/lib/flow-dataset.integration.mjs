import {readFileSync, existsSync} from "node:fs";
import {join} from "node:path";
import {strict as assert} from "node:assert";

const root = process.cwd();
const source = JSON.parse(readFileSync(join(root, "public/data/exercises-dataset-mit.json"), "utf8"));
const index = JSON.parse(readFileSync(join(root, "public/data/flow-animation-index.json"), "utf8"));
assert.equal(index.revision, "961bb2739015da373daa43b960c28ee839fe93e6");
assert.ok(Array.isArray(index.animatedIds) && index.animatedIds.length >= 1200,
  "At least 1,200 exercises must have verified animated Flow artwork");
assert.equal(new Set(index.animatedIds).size, index.animatedIds.length);
assert.equal(index.animatedIds.length + index.instructionsOnly, 1324);
const sourceIds = new Set(source.map(item => item.id));
for (const id of index.animatedIds) {
  assert.ok(sourceIds.has(id), "Cannot animate an unknown exercise: " + id);
  for (let i = 0; i < 3; i++) {
    assert.ok(existsSync(join(root, "public/flow-demos", id, "frame-0" + i + ".svg")),
      "Missing frame " + i + " for Flow exercise " + id);
  }
}
console.log("Flow: " + index.animatedIds.length + " verified self-hosted animations (3 frames each) with source ID/name checks");
