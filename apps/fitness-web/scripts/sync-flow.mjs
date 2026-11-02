/**
 * Pinned, self-hosted Flow SVG animations for the Exercises Dataset catalog.
 * Reconstructs public/flow-demos at build time; no Gym visual/GIF assets.
 * Source: https://github.com/ozansozuozgit/flow-exercise-dataset
 * SVG artwork: CC0-1.0 to the extent of the creator's rights (see NOTICE).
 */
import {readFile, writeFile, mkdtemp, mkdir, rm, copyFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join, resolve, sep} from "node:path";

const REVISION = "961bb2739015da373daa43b960c28ee839fe93e6";
const URL = "https://codeload.github.com/ozansozuozgit/flow-exercise-dataset/tar.gz/" + REVISION;
const project = process.cwd();
const localData = join(project, "public/data/exercises-dataset-mit.json");
const output = join(project, "public/flow-demos");
const indexFile = join(project, "public/data/flow-animation-index.json");
const normalize = value => String(value ?? "").toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

async function download(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120000),
        headers: {"User-Agent": "codapia-fitness-flow-import"}
      });
      if (!response.ok) throw new Error("Flow download HTTP " + response.status);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      console.warn("Flow download attempt " + (attempt + 1) + " failed:", error.message);
    }
  }
  throw lastError;
}

const tmp = await mkdtemp(join(tmpdir(), "fitness-flow-"));
try {
  const archive = join(tmp, "source.tar.gz");
  const snapshot = join(tmp, "snapshot");
  await mkdir(snapshot, {recursive: true});
  await writeFile(archive, await download(URL));
  execFileSync("tar", ["-xzf", archive, "--strip-components=1", "-C", snapshot], {stdio: "inherit"});

  const [flow, local] = await Promise.all([
    readFile(join(snapshot, "data/exercises.json"), "utf8").then(JSON.parse),
    readFile(localData, "utf8").then(JSON.parse)
  ]);
  if (!Array.isArray(flow) || flow.length !== 1324 || !Array.isArray(local) || local.length !== 1324) {
    throw new Error("Exercise dataset counts differ from the pinned 1,324-record release");
  }
  const localById = new Map(local.map(item => [item.id, item]));
  const animated = flow.filter(item => item.animation);
  if (animated.length !== 1257) {
    throw new Error("Pinned Flow release should contain 1,257 animation records");
  }

  const ids = [];
  const mismatches = [];
  const sourceAssetsRoot = resolve(snapshot, "assets") + sep;
  await rm(output, {recursive: true, force: true});
  await mkdir(output, {recursive: true});
  for (const item of animated) {
    const original = localById.get(item.id);
    // Prevent showing an unrelated animation on an exercise just because an ID matches.
    if (!original || normalize(original.n) !== normalize(item.name)) {
      mismatches.push({id: item.id, exercise: original?.n ?? null, flow: item.name});
      continue;
    }
    const frames = item.animation.frames;
    if (!Array.isArray(frames) || frames.length !== 3) {
      throw new Error("Invalid Flow frame sequence for " + item.id);
    }
    const dir = join(output, item.id);
    await mkdir(dir, {recursive: true});
    for (let i = 0; i < frames.length; i++) {
      const relative = frames[i];
      if (typeof relative !== "string" || !relative.endsWith(".svg")) {
        throw new Error("Invalid Flow frame path for " + item.id);
      }
      const source = resolve(snapshot, relative);
      if (!source.startsWith(sourceAssetsRoot)) {
        throw new Error("Flow frame path leaves the source assets directory: " + relative);
      }
      await copyFile(source, join(dir, "frame-0" + i + ".svg"));
    }
    ids.push(item.id);
  }
  if (ids.length < 1200) {
    throw new Error("Too few verified matches (" + ids.length + "); aborting to avoid inaccurate exercise animations");
  }
  const manifest = {
    source: "Flow Exercise Dataset",
    upstream: "https://github.com/ozansozuozgit/flow-exercise-dataset",
    revision: REVISION,
    artworkLicense: "CC0-1.0, to the extent of rights held by Flow; see NOTICE.md",
    animatedIds: ids.sort(),
    unmatched: mismatches,
    instructionsOnly: local.length - ids.length
  };
  await writeFile(indexFile, JSON.stringify(manifest));
  console.log("Flow self-hosted SVG animations: " + ids.length + " matched exercises; " +
    mismatches.length + " unverified ID/name matches skipped; " + (local.length - ids.length) +
    " without animation.");
} finally {
  await rm(tmp, {recursive: true, force: true});
}
