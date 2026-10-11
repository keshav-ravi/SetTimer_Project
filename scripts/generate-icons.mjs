// Generates the app icons into public/. Run with:  node scripts/generate-icons.mjs
// To change the design, edit the SVG below and run it again.
//
// The icon is a timer ring (open at the top right) with a short hand, white on
// near-black. "Maskable" icons get extra padding because Android may crop them
// into a circle or rounded square.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import React from "react";

// next/og is a CommonJS module, so load it with require from this ES module.
const { ImageResponse } = createRequire(import.meta.url)("next/og");

const BACKGROUND = "#0a0a0a";
const FOREGROUND = "#ffffff";

// scale 1 fills the icon; 0.7 leaves the safe margin maskable icons need.
function svg(scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BACKGROUND}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="${FOREGROUND}" stroke-width="44"
      stroke-linecap="round" stroke-dasharray="660 283" transform="rotate(-70 256 256)"/>
    <line x1="256" y1="256" x2="256" y2="170" stroke="${FOREGROUND}" stroke-width="36" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="22" fill="${FOREGROUND}"/>
  </g>
</svg>`;
}

async function render(size, scale) {
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg(scale))}`;
  const image = React.createElement("img", { src: dataUri, width: size, height: size });
  const response = new ImageResponse(image, { width: size, height: size });
  return Buffer.from(await response.arrayBuffer());
}

const outputs = [
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["apple-touch-icon.png", 180, 1], // iPhone Home Screen; iOS rounds the corners itself
  ["icon-maskable-512.png", 512, 0.7],
];

for (const [name, size, scale] of outputs) {
  const file = path.join("public", name);
  fs.writeFileSync(file, await render(size, scale));
  console.log("wrote", file, `${size}x${size}`);
}
