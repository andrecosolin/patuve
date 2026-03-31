const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const BG_COLOR = "#0a0a0f";
const TITLE_COLOR = "#f5e642";
const SUBTITLE_COLOR = "#ffffff";
const OUTPUT_DIR = path.join(__dirname, "assets", "images");

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fitFontSize(ctx, text, targetWidth, fontFamily, fontWeight = "bold") {
  let size = 40;
  for (let i = 0; i < 300; i += 1) {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const width = ctx.measureText(text).width;
    if (width >= targetWidth) break;
    size += 2;
  }
  return size;
}

function drawCenteredTitle(canvas, text, widthRatio) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  const titleWidthTarget = width * widthRatio;
  const titleSize = fitFontSize(ctx, text, titleWidthTarget, "sans-serif", "bold");
  ctx.font = `bold ${titleSize}px sans-serif`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
}

function saveCanvas(canvas, filename) {
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  return outputPath;
}

function createIcon() {
  const canvas = createCanvas(1024, 1024);
  drawCenteredTitle(canvas, "PATUVÊ", 0.6);
  return saveCanvas(canvas, "icon.png");
}

function createAdaptiveIcon() {
  const canvas = createCanvas(1024, 1024);
  drawCenteredTitle(canvas, "PATUVÊ", 0.6);
  return saveCanvas(canvas, "adaptive-icon.png");
}

function createSplash() {
  const canvas = createCanvas(1284, 2778);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const title = "PATUVÊ";
  const subtitle = "Pra tu ver a vaga certa";

  const titleSize = fitFontSize(ctx, title, canvas.width * 0.6, "sans-serif", "bold");
  ctx.font = `bold ${titleSize}px sans-serif`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerY = canvas.height / 2;
  const titleY = centerY - titleSize * 0.1;
  ctx.fillText(title, canvas.width / 2, titleY);

  const subtitleSize = Math.round(titleSize * 0.22);
  ctx.font = `600 ${subtitleSize}px sans-serif`;
  ctx.fillStyle = SUBTITLE_COLOR;
  ctx.textBaseline = "top";
  ctx.fillText(subtitle, canvas.width / 2, titleY + titleSize * 0.72);

  return saveCanvas(canvas, "splash.png");
}

function main() {
  ensureOutputDir();
  const generated = [createIcon(), createAdaptiveIcon(), createSplash()];
  console.log("Assets gerados:");
  generated.forEach((file) => console.log(`- ${file}`));
}

main();
