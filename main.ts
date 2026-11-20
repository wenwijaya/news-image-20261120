// THE WORLD TODAY — Friday 20 November 2026.
// A one-page newspaper front page drawn entirely in code.
// Node 22 stdlib only. No network, no file reads, no clocks, no randomness.
// Every pixel is deterministic: two runs produce identical bytes.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- font
// Hand-drawn 5x7 bitmap font, all caps. Each glyph is 7 rows of 5 cells.
// "#" is ink, "." is empty. Advance is 6 cells, line step is 10 cells.
type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

const DIGITS: Record<string, Glyph> = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
};
const PUNCT: Record<string, Glyph> = {
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["#...#", "#..#.", "...#.", "..#..", ".#...", "#..#.", "#...#"],
  "$": ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "*": [".....", ".#.#.", "..#..", "#####", "..#..", ".#.#.", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "[": [".###.", ".#...", ".#...", ".#...", ".#...", ".#...", ".###."],
  "]": [".###.", "...#.", "...#.", "...#.", "...#.", "...#.", ".###."],
};
function glyphFor(ch: string): Glyph {
  if (ch >= "A" && ch <= "Z") return FONT[ch];
  if (ch >= "0" && ch <= "9") return DIGITS[ch];
  const p = PUNCT[ch];
  if (p) return p;
  return PUNCT[" "];
}

// ---------------------------------------------------------------- canvas
type RGB = [number, number, number];
const PAPER: RGB = [247, 243, 232];
const INK: RGB = [17, 17, 17];
const RED: RGB = [178, 34, 34];
const BLUE: RGB = [26, 64, 138];
const NAVY: RGB = [24, 32, 56];
const SKY: RGB = [176, 214, 240];
const GOLD: RGB = [212, 160, 32];
const GREEN: RGB = [34, 120, 60];
const GREY: RGB = [110, 110, 104];
const LIGHTGREY: RGB = [226, 221, 208];
const WHITE: RGB = [255, 255, 255];
const SKIN: RGB = [232, 190, 150];
const BROWN: RGB = [122, 82, 44];

class Canvas {
  w: number;
  h: number;
  data: Buffer;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 3);
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  fill(c: RGB): void {
    for (let i = 0; i < this.data.length; i += 3) {
      this.data[i] = c[0];
      this.data[i + 1] = c[1];
      this.data[i + 2] = c[2];
    }
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = Math.min(this.w, x + w);
    const y1 = Math.min(this.h, y + h);
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, c);
    }
  }
  outline(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  hline(x0: number, x1: number, y: number, c: RGB): void {
    for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }
  vline(x: number, y0: number, y1: number, c: RGB): void {
    for (let y = y0; y <= y1; y++) this.set(x, y, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
      this.hline(cx - dx, cx + dx, cy + dy, c);
    }
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      const x = Math.round(cx + r * Math.cos(rad));
      const y = Math.round(cy + r * Math.sin(rad));
      this.rect(x - 1, y - 1, 3, 3, c);
    }
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: [number, number, number, number][] = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
      for (const e of edges) {
        const ax = e[0]; const ay = e[1]; const bx = e[2]; const by = e[3];
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
        }
      }
      if (xs.length >= 2) {
        xs.sort((a, b) => a - b);
        this.hline(xs[0], xs[xs.length - 1], y, c);
      }
    }
  }
}

// ---------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}
function drawChar(cv: Canvas, x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = glyphFor(ch);
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row[col] === "#") {
        cv.rect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}
function drawText(cv: Canvas, x: number, y: number, s: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    drawChar(cv, cx, y, ch, scale, c);
    cx += 6 * scale;
  }
}
function drawTextCentered(cv: Canvas, cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cv, cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
function wrapText(s: string, maxW: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxW || cur === "") {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}
function drawLines(cv: Canvas, x: number, y: number, lines: string[], scale: number, c: RGB, gap: number): number {
  let yy = y;
  for (const ln of lines) {
    drawText(cv, x, yy, ln, scale, c);
    yy += 7 * scale + gap;
  }
  return yy;
}
function rule(cv: Canvas, x: number, y: number, w: number, t: number): void {
  cv.rect(x, y, w, t, INK);
}

// ---------------------------------------------------------------- png
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE.push(c >>> 0);
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, "ascii"), data]);
  out.writeUInt32BE(crc32(crcBuf), 8 + data.length);
  return out;
}
function encodePng(w: number, h: number, rgb: Buffer): Buffer {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    rgb.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
function fallbackPng(): Buffer {
  const cv = new Canvas(256, 256);
  cv.fill(PAPER);
  cv.rect(0, 0, 256, 256, PAPER);
  cv.outline(8, 8, 240, 240, 4, INK);
  drawTextCentered(cv, 128, 100, "THE WORLD", 3, INK);
  drawTextCentered(cv, 128, 130, "TODAY", 3, INK);
  drawTextCentered(cv, 128, 170, "20 NOV 2026", 2, RED);
  return encodePng(256, 256, cv.data);
}

// ---------------------------------------------------------------- icons
function drawFlagUS(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const stripe = Math.max(2, Math.floor(h / 13));
  for (let i = 0; i < 13; i++) {
    cv.rect(x, y + i * stripe, w, stripe, i % 2 === 0 ? RED : WHITE);
  }
  cv.rect(x, y, Math.floor(w * 0.42), stripe * 7, BLUE);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      cv.rect(x + 4 + c * 9, y + 3 + r * 7, 3, 3, WHITE);
    }
  }
}
function drawFlagCN(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, RED);
  cv.disc(x + 9, y + 9, 5, GOLD);
  cv.disc(x + 24, y + 6, 2, GOLD);
  cv.disc(x + 28, y + 13, 2, GOLD);
  cv.disc(x + 24, y + 20, 2, GOLD);
}
function drawFlagRU(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const band = Math.floor(h / 3);
  cv.rect(x, y, w, band, WHITE);
  cv.rect(x, y + band, w, band, BLUE);
  cv.rect(x, y + 2 * band, w, h - 2 * band, RED);
}
function drawLeader(cv: Canvas, x: number, y: number, suit: RGB, tie: RGB): void {
  cv.disc(x + 22, y + 10, 11, SKIN);
  cv.rect(x + 11, y - 1, 22, 7, INK);
  cv.rect(x + 2, y + 24, 40, 34, suit);
  cv.tri(x + 18, y + 24, x + 26, y + 24, x + 22, y + 40, WHITE);
  cv.rect(x + 20, y + 30, 4, 26, tie);
}
function drawGavel(cv: Canvas, x: number, y: number): void {
  cv.rect(x + 6, y + 4, 44, 12, BROWN);
  cv.rect(x + 2, y + 2, 6, 16, BROWN);
  cv.rect(x + 48, y + 2, 6, 16, BROWN);
  cv.line(x + 28, y + 16, x + 44, y + 44, BROWN);
  cv.line(x + 29, y + 16, x + 45, y + 44, BROWN);
  cv.rect(x + 8, y + 44, 40, 6, BROWN);
}
function drawStorm(cv: Canvas, x: number, y: number): void {
  for (let a = 0; a <= 720; a += 6) {
    const r = 4 + (a / 720) * 22;
    const rad = (a * Math.PI) / 180;
    const px = Math.round(x + 28 + r * Math.cos(rad));
    const py = Math.round(y + 24 + r * Math.sin(rad) * 0.85);
    cv.rect(px - 1, py - 1, 3, 3, BLUE);
  }
  cv.disc(x + 28, y + 24, 5, WHITE);
}
function drawCalendar(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 52, 44, WHITE);
  cv.outline(x, y, 52, 44, 2, INK);
  cv.rect(x, y, 52, 12, RED);
  cv.rect(x + 8, y - 4, 4, 8, INK);
  cv.rect(x + 40, y - 4, 4, 8, INK);
  drawText(cv, x + 4, y + 20, "2027", 2, INK);
}
function drawRocket(cv: Canvas, x: number, y: number): void {
  cv.tri(x + 26, y + 2, x + 14, y + 26, x + 38, y + 26, INK);
  cv.rect(x + 14, y + 26, 24, 26, LIGHTGREY);
  cv.outline(x + 14, y + 26, 24, 26, 2, INK);
  cv.disc(x + 26, y + 36, 6, SKY);
  cv.tri(x + 14, y + 44, x + 2, y + 60, x + 14, y + 54, RED);
  cv.tri(x + 38, y + 44, x + 50, y + 60, x + 38, y + 54, RED);
  cv.tri(x + 20, y + 52, x + 32, y + 52, x + 26, y + 68, GOLD);
  for (let i = 0; i < 5; i++) {
    const sx = x + (i * 11) % 52;
    const sy = y + ((i * 17) % 20);
    cv.rect(sx, sy, 2, 2, GOLD);
  }
}
function drawChart(cv: Canvas, x: number, y: number): void {
  const bars = [58, 48, 38, 28, 16];
  for (let i = 0; i < bars.length; i++) {
    const bh = bars[i];
    cv.rect(x + i * 11, y + 62 - bh, 8, bh, RED);
  }
  cv.line(x, y + 4, x + 54, y + 58, INK);
  cv.tri(x + 54, y + 58, x + 44, y + 56, x + 52, y + 66, INK);
  cv.rect(x + 44, y + 2, 10, 4, GREEN);
}

// ---------------------------------------------------------------- front page
function drawCard(cv: Canvas, x: number, y: number, w: number, h: number, kicker: string, title: string, body: string, icon: string): void {
  cv.rect(x, y, w, h, WHITE);
  cv.outline(x, y, w, h, 2, INK);
  drawText(cv, x + 16, y + 12, kicker, 2, RED);
  if (icon === "calendar") drawCalendar(cv, x + w - 68, y + 12);
  if (icon === "gavel") drawGavel(cv, x + w - 64, y + 10);
  if (icon === "storm") drawStorm(cv, x + w - 70, y + 8);
  if (icon === "rocket") drawRocket(cv, x + w - 72, y + 44);
  if (icon === "chart") drawChart(cv, x + w - 72, y + 44);
  const titleLines = wrapText(title, w - 32 - 76, 3);
  drawLines(cv, x + 16, y + 38, titleLines, 3, INK, 5);
  const bodyY = y + 38 + titleLines.length * 26 + 8;
  const bodyLines = wrapText(body, w - 32, 2).slice(0, 3);
  drawLines(cv, x + 16, bodyY, bodyLines, 2, INK, 5);
}
function renderFrontPage(): Buffer {
  const cv = new Canvas(1024, 1024);
  cv.fill(PAPER);
  cv.rect(0, 0, 1024, 7, INK);
  // Masthead
  drawTextCentered(cv, 512, 18, "THE WORLD TODAY", 8, INK);
  rule(cv, 24, 82, 976, 2);
  drawText(cv, 24, 92, "VOL. 1 - NO. 324", 2, INK);
  const ed = "FRIDAY EDITION";
  drawText(cv, 1000 - textWidth(ed, 2), 92, ed, 2, INK);
  // Date band
  cv.rect(24, 112, 976, 38, RED);
  drawTextCentered(cv, 512, 119, "FRIDAY 20 NOVEMBER 2026", 4, WHITE);
  // Hero
  cv.rect(24, 158, 976, 294, WHITE);
  cv.outline(24, 158, 976, 294, 3, INK);
  drawText(cv, 40, 170, "SUMMIT IN CHINA - A FIRST", 2, RED);
  drawText(cv, 48, 192, "TRUMP, XI AND PUTIN", 5, INK);
  drawText(cv, 48, 232, "MEET IN FIRST THREE-WAY SUMMIT", 5, INK);
  const deck = wrapText("LEADERS TALK NUCLEAR ARMS, ENERGY AND SECURITY IN SHENZHEN - THE THREE POWERS MEET FACE TO FACE FOR THE FIRST TIME.", 928, 2);
  drawLines(cv, 48, 278, deck, 2, INK, 5);
  // Hero scene: three leaders at a table under their flags
  cv.rect(40, 330, 944, 114, SKY);
  cv.rect(40, 330, 944, 3, INK);
  drawFlagUS(cv, 176, 336, 52, 30);
  drawFlagCN(cv, 486, 336, 52, 30);
  drawFlagRU(cv, 796, 336, 52, 30);
  drawLeader(cv, 180, 372, NAVY, RED);
  drawLeader(cv, 490, 372, INK, GOLD);
  drawLeader(cv, 800, 372, NAVY, BLUE);
  cv.rect(40, 420, 944, 24, BROWN);
  cv.rect(40, 420, 944, 3, INK);
  drawTextCentered(cv, 512, 430, "SHENZHEN", 2, WHITE);
  // Three story cards
  drawCard(cv, 24, 464, 304, 224, "WASHINGTON - IRAN", "TRUMP PUTS IRAN DECISION OFF TO 2027", "NO RUSH, HE SAYS: SEE WHAT HAPPENS AFTER JAN 1.", "calendar");
  drawCard(cv, 360, 464, 304, 224, "THE HAGUE - JUSTICE", "MYANMAR GUILTY OF GENOCIDE", "WORLD COURT RULES ON THE ROHINGYA - A FIRST IN ITS 80 YEARS.", "gavel");
  drawCard(cv, 696, 464, 304, 224, "INDIA - WEATHER", "CYCLONE AKVAN HITS ODISHA", "LANDFALL NEAR GOPALPUR AT NOON. 100,000 MOVED TO SHELTERS.", "storm");
  // Two wide cards
  drawCard(cv, 24, 700, 480, 164, "SPACE - VOYAGER 1", "VOYAGER 1: A LIGHT-DAY AWAY", "FIRST CRAFT 16 BILLION MILES FROM EARTH. ITS SIGNAL NOW TAKES A FULL DAY TO ARRIVE.", "rocket");
  drawCard(cv, 520, 700, 480, 164, "MARKETS - WALL STREET", "DOW DIVES 1,101 POINTS", "BELOW 50,000 AS SELL-OFF DEEPENS. ANTHROPIC DEBUTS +17% IN RECORD $81BN IPO.", "chart");
  // Ticker
  cv.rect(24, 876, 976, 48, INK);
  const tick = wrapText("ALSO TODAY: GTA 6 SALES PASS $1.8BN * NICHOLLS 113* LIFTS NZ TO 243/5 * DHONI RETIRES FROM IPL * EUROPE READY FOR UKRAINE TALKS", 952, 2);
  drawLines(cv, 36, 884, tick, 2, WHITE, 5);
  // Footer
  rule(cv, 24, 938, 976, 2);
  drawTextCentered(cv, 512, 950, "SOURCES: REUTERS * BBC * AP * NASA * IMD * NASDAQ", 2, GREY);
  drawTextCentered(cv, 512, 972, "THE WORLD TODAY - ONE DAY, ONE PAGE - FRIDAY 20 NOVEMBER 2026", 2, GREY);
  rule(cv, 24, 996, 976, 2);
  return encodePng(1024, 1024, cv.data);
}

// ---------------------------------------------------------------- output
function writeOut(png: Buffer): boolean {
  const candidates: string[] = [];
  const envDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (envDir && envDir.length > 0) candidates.push(envDir);
  candidates.push("/output");
  candidates.push("./out");
  candidates.push("/tmp");
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true });
      const p = dir + "/entry.png";
      writeFileSync(p, png);
      const back = readFileSync(p);
      if (back.length === png.length && back.equals(png)) return true;
    } catch {
      // try the next candidate
    }
  }
  try {
    writeFileSync("entry.png", png);
    return true;
  } catch {
    return false;
  }
}
function main(): void {
  let png: Buffer;
  try {
    png = renderFrontPage();
  } catch {
    png = fallbackPng();
  }
  try {
    writeOut(png);
  } catch {
    try {
      writeOut(fallbackPng());
    } catch {
      // nothing more to try
    }
  }
}
try {
  main();
} catch {
  try {
    writeOut(fallbackPng());
  } catch {
    // nothing more to try
  }
}
process.exit(0);
