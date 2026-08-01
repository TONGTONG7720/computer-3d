import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const buildRoot = path.join(process.cwd(), ".next");
const builderRoot = path.join(buildRoot, "server", "app", "builder");
const builderHtml = await readFile(`${builderRoot}.html`, "utf8");
const loadableManifest = JSON.parse(
  await readFile(path.join(builderRoot, "page", "react-loadable-manifest.json"), "utf8"),
);

const initialAssets = new Set(
  [...builderHtml.matchAll(/\/_next\/(static\/chunks\/[^"']+\.(?:css|js))/g)].map(
    (match) => match[1],
  ),
);
assert.ok(initialAssets.size > 0, "Builder HTML did not declare any initial chunk assets");

const loadableEntries = await Promise.all(
  Object.entries(loadableManifest).map(async ([id, entry]) => {
    const files = entry.files.filter((file) => file.endsWith(".css") || file.endsWith(".js"));
    const javascript = files.filter((file) => file.endsWith(".js"));
    const source = (
      await Promise.all(javascript.map((file) => readFile(path.join(buildRoot, file), "utf8")))
    ).join("\n");
    return { files, id, source };
  }),
);

const dialogEntry = loadableEntries.find(
  ({ source }) => source.includes("PriceComparisonDialog") && source.includes("PRICE INTELLIGENCE"),
);
const threeEntry = loadableEntries.find(
  ({ source }) => source.includes("ThreeDViewport") && source.includes("@react-three/fiber"),
);

assert.ok(dialogEntry, "PriceComparisonDialog was not found in a loadable production chunk");
assert.ok(threeEntry, "ThreeDViewport was not found in a loadable production chunk");
assert.notEqual(
  dialogEntry.id,
  threeEntry.id,
  "Price dialog and Three.js shared one loadable chunk",
);

for (const file of [...dialogEntry.files, ...threeEntry.files]) {
  assert.ok(!initialAssets.has(file), `${file} leaked into the initial /builder assets`);
}

const initialJavascript = [...initialAssets].filter((file) => file.endsWith(".js"));
const initialSource = (
  await Promise.all(initialJavascript.map((file) => readFile(path.join(buildRoot, file), "utf8")))
).join("\n");
assert.ok(
  !initialSource.includes("PRICE INTELLIGENCE"),
  "PriceComparisonDialog implementation leaked into the initial /builder JavaScript",
);
assert.ok(
  !initialSource.includes("@react-three/fiber"),
  "Three.js implementation leaked into the initial /builder JavaScript",
);

console.log(
  `Builder bundle boundary verified: ${initialAssets.size} initial assets; dialog ${dialogEntry.files.join(", ")}; 3D ${threeEntry.files.join(", ")}`,
);
