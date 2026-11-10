import fs from "node:fs";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const input = "Flight Simulator 3D v2.8.sb3";
const outDir = "analysis";
fs.mkdirSync(outDir, { recursive: true });
const zip = fs.readFileSync(input);
const u16 = (o) => zip.readUInt16LE(o);
const u32 = (o) => zip.readUInt32LE(o);
let eocd = -1;
for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65558); i--) {
  if (u32(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error("Invalid SB3 ZIP: end-of-central-directory not found");
const count = u16(eocd + 10);
let cursor = u32(eocd + 16);
const entries = [];
for (let i = 0; i < count; i++) {
  if (u32(cursor) !== 0x02014b50) throw new Error("Invalid ZIP central directory");
  const method = u16(cursor + 10);
  const compressedSize = u32(cursor + 20);
  const uncompressedSize = u32(cursor + 24);
  const nameLength = u16(cursor + 28);
  const extraLength = u16(cursor + 30);
  const commentLength = u16(cursor + 32);
  const localOffset = u32(cursor + 42);
  const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
  entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
  cursor += 46 + nameLength + extraLength + commentLength;
}
const projectEntry = entries.find((entry) => entry.name === "project.json");
if (!projectEntry) throw new Error("SB3 archive has no project.json");
const local = projectEntry.localOffset;
const dataOffset = local + 30 + u16(local + 26) + u16(local + 28);
const compressed = zip.subarray(dataOffset, dataOffset + projectEntry.compressedSize);
const projectBytes = projectEntry.method === 0 ? compressed :
  projectEntry.method === 8 ? inflateRawSync(compressed) : null;
if (!projectBytes) throw new Error("Unsupported ZIP compression method: " + projectEntry.method);
const project = JSON.parse(projectBytes.toString("utf8"));
const targets = (project.targets || []).map((target) => {
  const blocks = target.blocks || {};
  const opcodeCounts = {};
  const topLevel = [];
  const procedures = [];
  for (const [id, block] of Object.entries(blocks)) {
    opcodeCounts[block.opcode] = (opcodeCounts[block.opcode] || 0) + 1;
    if (block.topLevel) topLevel.push({
      id, opcode: block.opcode, x: block.x, y: block.y,
      next: block.next, inputs: block.inputs, fields: block.fields
    });
    if (block.opcode === "procedures_definition") {
      const custom = block.inputs?.custom_block?.[1]?.[1];
      procedures.push({ id, prototypeId: custom, mutation: blocks[custom]?.mutation || null });
    }
  }
  return {
    name: target.name, isStage: !!target.isStage, visible: target.visible,
    position: { x: target.x, y: target.y, direction: target.direction, size: target.size },
    rotationStyle: target.rotationStyle,
    costumes: (target.costumes || []).map(({ name, md5ext, dataFormat, bitmapResolution, rotationCenterX, rotationCenterY }) =>
      ({ name, md5ext, dataFormat, bitmapResolution, rotationCenterX, rotationCenterY })),
    sounds: (target.sounds || []).map(({ name, md5ext, dataFormat, rate, sampleCount }) =>
      ({ name, md5ext, dataFormat, rate, sampleCount })),
    variables: Object.entries(target.variables || {}).map(([id, v]) => ({ id, name: v[0], value: v[1], cloud: !!v[2] })),
    lists: Object.entries(target.lists || {}).map(([id, v]) => ({ id, name: v[0], length: (v[1] || []).length, values: v[1] })),
    blockCount: Object.keys(blocks).length, opcodeCounts,
    topLevelScripts: topLevel, customProcedures: procedures
  };
});
const report = {
  source: input, archive: { bytes: zip.length, entries: entries.map(({ name, uncompressedSize, compressedSize }) => ({ name, uncompressedSize, compressedSize })) },
  project: { targetCount: targets.length, monitors: project.monitors || [], extensions: project.extensions || [], meta: project.meta || {} },
  targets
};
fs.writeFileSync(path.join(outDir, "scratch-project-analysis.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outDir, "scratch-project-extracted.json"), JSON.stringify(project));
console.log(JSON.stringify({
  archiveBytes: zip.length, fileCount: entries.length,
  targetCount: targets.length,
  targets: targets.map(t => ({ name: t.name, isStage: t.isStage, blocks: t.blockCount, costumes: t.costumes.length, sounds: t.sounds.length, variables: t.variables.map(v => v.name), lists: t.lists.map(v => v.name), scripts: t.topLevelScripts.length })),
  outputs: ["analysis/scratch-project-analysis.json", "analysis/scratch-project-extracted.json"]
}, null, 2));
