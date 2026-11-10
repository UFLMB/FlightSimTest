const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Packager = require("@turbowarp/packager");

const GRAPHICS_PROFILE = Object.freeze({
  // Keep Scratch's original coordinate system unchanged.
  stageWidth: 480,
  stageHeight: 360,

  // Render-only quality settings. Project timing remains at its original 30 Hz.
  framerate: 30,
  interpolation: true,
  highQualityPen: true,
  maxTextureDimension: 4096
});

async function main() {
  const sourcePath = path.resolve("Flight Simulator 3D v2.8.sb3");
  if (!fs.existsSync(sourcePath)) throw new Error("Original Scratch project file is missing");

  const source = fs.readFileSync(sourcePath);
  const sourceSha256 = crypto.createHash("sha256").update(source).digest("hex");
  console.log(`Loading original Scratch project (${source.length.toLocaleString()} bytes)`);

  const loadedProject = await Packager.loadProject(source, (type, a, b) => {
    if (type === "assets") console.log(`Assets: ${a}/${b}`);
    else console.log(`Preparing: ${type} ${a ?? ""} ${b ?? ""}`);
  });

  const packager = new Packager.Packager();
  packager.project = loadedProject;

  // Only TurboWarp renderer/quality options are changed. The original SB3
  // scripts, physics, controls, variables and stage coordinate system remain intact.
  Object.assign(packager.options, GRAPHICS_PROFILE);

  const result = await packager.package();
  if (result.type !== "text/html") throw new Error(`Expected standalone HTML, got ${result.type}`);

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync(path.join("dist", "index.html"), Buffer.from(result.data));
  fs.writeFileSync(path.join("dist", "build-info.json"), JSON.stringify({
    title: "Flight Simulator 3D v2.8",
    source: "Flight Simulator 3D v2.8.sb3",
    sourceSha256,
    packager: require("@turbowarp/packager/package.json").version,
    graphicsProfile: GRAPHICS_PROFILE,
    generatedAt: new Date().toISOString(),
    outputBytes: result.data.length
  }, null, 2));

  console.log(`Standalone game generated: dist/index.html (${result.data.length.toLocaleString()} bytes)`);
  console.log("Graphics profile:", JSON.stringify(GRAPHICS_PROFILE));
  console.log("Original project SHA-256:", sourceSha256);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
