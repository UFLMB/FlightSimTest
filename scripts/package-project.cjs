const fs = require("node:fs");
const path = require("node:path");
const Packager = require("@turbowarp/packager");

async function main() {
  const sourcePath = path.resolve("Flight Simulator 3D v2.8.sb3");
  if (!fs.existsSync(sourcePath)) throw new Error("Original Scratch project file is missing");
  const source = fs.readFileSync(sourcePath);
  console.log(`Loading original Scratch project (${source.length.toLocaleString()} bytes)`);
  const loadedProject = await Packager.loadProject(source, (type, a, b) => {
    if (type === "assets") console.log(`Assets: ${a}/${b}`);
    else console.log(`Preparing: ${type} ${a ?? ""} ${b ?? ""}`);
  });

  const packager = new Packager.Packager();
  packager.project = loadedProject;

  // The original aircraft/terrain renderer is pen-based 3D. Render its strokes
  // at the device's higher-quality backing resolution, but keep the original
  // 30 FPS timing and disable interpolation to protect frame-dependent physics.
  packager.options.highQualityPen = true;
  packager.options.framerate = 30;
  packager.options.interpolation = false;
  packager.options.turbo = false;

  const result = await packager.package();
  if (result.type !== "text/html") throw new Error(`Expected standalone HTML, got ${result.type}`);
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync(path.join("dist", "index.html"), Buffer.from(result.data));
  fs.writeFileSync(path.join("dist", "build-info.json"), JSON.stringify({
    title: "Flight Simulator 3D v2.8",
    source: "Flight Simulator 3D v2.8.sb3",
    packager: require("@turbowarp/packager/package.json").version,
    graphicsProfile: {
      highQualityPen: packager.options.highQualityPen,
      framerate: packager.options.framerate,
      interpolation: packager.options.interpolation,
      turbo: packager.options.turbo
    },
    generatedAt: new Date().toISOString(),
    outputBytes: result.data.length
  }, null, 2));
  console.log(`Standalone game generated: dist/index.html (${result.data.length.toLocaleString()} bytes)`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
