const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc((width * 4 + 1) * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // filter 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Distance to rounded rectangle
function distToRoundedRect(px, py, rx, ry, rw, rh, rad) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const dx = Math.abs(px - cx) - (rw / 2 - rad);
  const dy = Math.abs(py - cy) - (rh / 2 - rad);
  const outsideX = Math.max(0, dx);
  const outsideY = Math.max(0, dy);
  const cornerDist = Math.hypot(outsideX, outsideY) - rad;
  if (dx < 0 && dy < 0) {
    return Math.max(dx, dy) - rad; // inside
  }
  return cornerDist;
}

// Pixel artist
function renderMijanIcon(isMaskable) {
  return (x, y, width, height) => {
    const u = x / width;
    const v = y / height;

    // Background gradient: Rich Deep Indigo (#0b0f19 to #1e1b4b to #312e81)
    const bgT = (u * 0.4 + v * 0.6);
    let r = Math.round(11 + bgT * 38);
    let g = Math.round(15 + bgT * 31);
    let b = Math.round(25 + bgT * 104);
    let a = 255;

    // If not maskable, round outer corners (squircle)
    if (!isMaskable) {
      const outerDist = distToRoundedRect(x, y, 0, 0, width, height, width * 0.22);
      if (outerDist > 0) {
        // Outside squircle
        return [0, 0, 0, 0];
      } else if (outerDist > -2) {
        // Anti-alias outer edge
        const edgeAlpha = Math.max(0, Math.min(1, -outerDist / 2));
        a = Math.round(255 * edgeAlpha);
      }
    }

    // Scale coordinates to 0..100 unit space
    const sX = u * 100;
    const sY = v * 100;

    // Ambient radial glow in center
    const centerDist = Math.hypot(sX - 50, sY - 48);
    if (centerDist < 35) {
      const glowFactor = (1 - centerDist / 35) * 0.25;
      r = Math.min(255, Math.round(r + 99 * glowFactor));
      g = Math.min(255, Math.round(g + 102 * glowFactor));
      b = Math.min(255, Math.round(b + 241 * glowFactor));
    }

    // Computer screen body: 20..80 horizontal, 18..60 vertical
    const monDist = distToRoundedRect(sX, sY, 20, 18, 60, 44, 6);
    if (monDist <= 0) {
      // Inside monitor area
      // Monitor border stroke (thickness 2.6)
      if (monDist > -2.6) {
        // Neon Indigo stroke
        return [99, 102, 241, a];
      }
      // Screen interior: deep dark glass
      r = 17; g = 24; b = 39;
    }

    // Monitor stand neck & base:
    // Neck: 46..54 x, 62..72 y
    if (sX >= 45 && sX <= 55 && sY >= 62 && sY <= 72) {
      r = 79; g = 70; b = 229;
    }
    // Base: 34..66 x, 72..76 y
    const baseDist = distToRoundedRect(sX, sY, 34, 72, 32, 5, 2.5);
    if (baseDist <= 0) {
      return [139, 92, 246, a]; // vibrant purple base
    }

    // Draw 'M' Monogram inside monitor:
    // Points: (28, 52) -> (28, 28) -> (40, 42) -> (50, 32) -> (60, 42) -> (72, 28) -> (72, 52)
    // Thickness ~ 3.2
    const segments = [
      [29, 50, 29, 29],
      [29, 29, 41, 41],
      [41, 41, 50, 31],
      [50, 31, 59, 41],
      [59, 41, 71, 29],
      [71, 29, 71, 50]
    ];

    let minSegDist = 999;
    for (const [x1, y1, x2, y2] of segments) {
      const d = distToSegment(sX, sY, x1, y1, x2, y2);
      if (d < minSegDist) minSegDist = d;
    }

    if (minSegDist < 3.2) {
      // Vibrant pink-to-indigo gradient for M
      const t = (sX - 28) / 44;
      const mr = Math.round(99 + t * 137);   // 99 -> 236
      const mg = Math.round(102 - t * 30);   // 102 -> 72
      const mb = Math.round(241 - t * 88);   // 241 -> 153
      return [mr, mg, mb, a];
    } else if (minSegDist < 4.2) {
      // Glow around M
      const glowT = (1 - (minSegDist - 3.2));
      r = Math.min(255, Math.round(r + 140 * glowT));
      g = Math.min(255, Math.round(g + 90 * glowT));
      b = Math.min(255, Math.round(b + 240 * glowT));
    }

    // Cosmetics Sparkle Star at Top Right (76, 20):
    const starDist = Math.hypot(sX - 76, sY - 20);
    const starCrossX = Math.abs(sX - 76);
    const starCrossY = Math.abs(sY - 20);
    if ((starCrossX < 1.4 && starCrossY < 6) || (starCrossY < 1.4 && starCrossX < 6) || starDist < 2) {
      // Gold sparkle #f59e0b
      return [245, 158, 11, a];
    }

    // Mini star at (24, 23)
    const star2Dist = Math.hypot(sX - 24, sY - 23);
    const star2CrossX = Math.abs(sX - 24);
    const star2CrossY = Math.abs(sY - 23);
    if ((star2CrossX < 1.0 && star2CrossY < 4) || (star2CrossY < 1.0 && star2CrossX < 4)) {
      return [251, 191, 36, a];
    }

    // Monogram pill pill badge at bottom: 25..75 x, 82..91 y
    const pillDist = distToRoundedRect(sX, sY, 26, 82, 48, 9, 4.5);
    if (pillDist <= 0) {
      if (pillDist > -1.2) {
        return [99, 102, 241, a]; // border
      }
      return [30, 27, 75, a]; // deep indigo
    }

    return [r, g, b, a];
  };
}

// Generate all target files
const pubDir = path.join(__dirname, '../client/public');

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false }
];

for (const target of targets) {
  const filePath = path.join(pubDir, target.file);
  const buf = createPng(target.size, target.size, renderMijanIcon(target.maskable));
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${target.file} (${target.size}x${target.size}) - ${buf.length} bytes`);
}
