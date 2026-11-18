// 픽셀 그림 빌드: node pixel/build.mjs
// public/px/*.gif (배율 적용), pixel/preview/*.png (확인용)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import gifenc from 'gifenc';
import { PNG } from 'pngjs';
import { Sprite, compose, sticker, flipPx } from './engine.mjs';
import { sideDog, VARIANTS, OUT as DOG_OUT } from './breeds.mjs';

const { GIFEncoder } = gifenc;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'px');
const PREV = join(ROOT, 'pixel', 'preview');
mkdirSync(OUT, { recursive: true }); mkdirSync(PREV, { recursive: true });

// ---------- 공통 색
const INK = '#3a2a22';
const PAPER = '#efe7d8';
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = (() => { const m = new Map(); return (x, y) => { const k = x * 1000 + y; if (!m.has(k)) { const r = rnd(); m.set(k, r < 0.035 ? '#e4d9c5' : r < 0.05 ? '#f5eee2' : PAPER); } return m.get(k); }; })();

// ---------- 보호자 (28×32), 한복. 강아지와 같은 밀도
function owner(f = 0, opts = {}) {
  const s = new Sprite(28, 32);
  const SKIN = { base: '#f6dcc6', shade: '#e6bea3' };
  const HAIR = { base: '#2a2220', shade: '#1b1514' };
  s.def('chima', { base: '#93a6bd', shade: '#7489a3' });
  s.poly([[9, 16], [19, 16], [25.5, 28.5], [2.5, 28.5]], 'chima').ellipse(14, 28.4, 11.8, 3, 'chima');
  s.def('jeo', { base: '#f8f2e6', shade: '#e3d8c3' });
  s.poly([[9.5, 12.5], [18.5, 12.5], [20, 20.5], [8, 20.5]], 'jeo');
  s.def('sleeve', { base: '#f8f2e6', shade: '#e3d8c3', edge: '#231c1a' });
  s.ellipse(9.2, 17.4, 2.6, 4.3, 'sleeve', 0.45).ellipse(18.8, 17.4, 2.6, 4.3, 'sleeve', -0.45);
  s.def('braid', { ...HAIR, edge: '#231c1a' });
  s.stroke([[18, 8], [19.2, 12], [19.4, 16], [19.2, 18.6]], 1.1, 'braid');
  s.def('hand', { ...SKIN, edge: '#231c1a' });
  s.ellipse(14, 21.2, 2.3, 1.3, 'hand');
  s.def('neck', { ...SKIN, flat: true });
  s.rect(13, 11, 2, 2, 'neck');
  s.def('hairB', { ...HAIR });
  s.ellipse(14, 6.8, 5.7, 6.1, 'hairB');
  s.def('face', { ...SKIN });
  s.ellipse(14, 8, 4.3, 4.3, 'face');
  s.def('bang', { ...HAIR, edge: '#231c1a' });
  s.poly([[9.4, 6.4], [10.6, 3.2], [14, 2], [17.4, 3.2], [18.6, 6.4], [16.9, 5.1], [14.3, 4.8], [14, 5.6], [13.7, 4.8], [11.1, 5.1]], 'bang');
  for (const k of Object.keys(s.parts)) s.parts[k].light = s.parts[k].base;
  s.render(DOG_OUT, { lightDir: [0, -1] });
  const R = '#c9442d', R2 = '#962f1e', E = '#231c1a';
  s.dots([[12, 12], [13, 13], [14, 14], [15, 13], [16, 12]], '#ffffff');
  s.dots([[11, 15], [12, 15], [15, 15], [16, 15], [12, 17], [12, 18], [15, 17], [15, 18]], R).dots([[13, 16], [14, 16]], R2);
  s.dots([[18, 20], [19, 20], [20, 20]], R);
  if (opts.blink) s.dots([[11, 9], [12, 9], [16, 9], [17, 9]], '#6b4a3e');
  else s.dots([[11, 8], [12, 8], [16, 8], [17, 8], [12, 9], [17, 9]], E);
  s.dots([[10, 10], [18, 10]], '#f0a49a');
  s.dot(14, 10, '#c98a76');
  return s;
}

const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return '#' + [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
};

// ---------- 소품
function grass(x, y) { const s = new Sprite(3, 2); s.def('g', { base: '#8b875c', flat: true }); s.mark(0, 0, 'g'); s.mark(2, 0, 'g'); s.mark(1, 1, 'g'); s.render(null); return { s, x, y }; }
function flower(x, y, col = '#ffffff') {
  const s = new Sprite(3, 4); s.def('p', { base: col, flat: true }); s.def('c', { base: '#e8b84a', flat: true }); s.def('st', { base: '#7f8a52', flat: true });
  s.mark(1, 0, 'p'); s.mark(0, 1, 'p'); s.mark(2, 1, 'p'); s.mark(1, 1, 'c'); s.mark(1, 2, 'st'); s.mark(1, 3, 'st'); s.render(null); return { s, x, y };
}
function shadow(cx, cy, rx, ry) { const s = new Sprite(Math.ceil(rx * 2) + 2, Math.ceil(ry * 2) + 2); s.def('sh', { base: '#ddd1bb', flat: true }); s.ellipse(rx + 1, ry + 1, rx, ry, 'sh'); s.render(null); return { s, x: Math.round(cx - rx - 1), y: Math.round(cy - ry - 1) }; }
function petal(x, y) { const s = new Sprite(2, 2); s.def('p', { base: '#eeaaa0', flat: true }); s.mark(0, 0, 'p'); s.mark(1, 1, 'p'); s.mark(1, 0, 'p'); s.render(null); return { s, x: Math.round(x), y: Math.round(y) }; }
function door() {
  const s = new Sprite(16, 30);
  s.def('fr', { base: '#8a5a3a', light: '#a06c48', shade: '#6c432a' }); s.def('dr', { base: '#c08a5a', light: '#d29c6b', shade: '#a2703f', edge: '#6c432a' });
  s.rect(0, 0, 16, 30, 'fr'); s.rect(2, 2, 12, 28, 'dr'); s.render(DOG_OUT);
  s.dots([[4, 6], [11, 6], [4, 7], [11, 7]], '#a2703f');
  s.dots([[11, 16], [12, 16]], '#e8c46a');
  for (let y = 4; y < 28; y += 6) s.dots([[3, y], [12, y]], '#b07c4c');
  return s;
}

// ---------- 출력
function toIndexed(pixels, w, h, scale) {
  const pal = [[0, 0, 0]], idx = new Map();
  const W = w * scale, H = h * scale, out = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = pixels[y * w + x]; let k = 0;
    if (c) { if (!idx.has(c)) { idx.set(c, pal.length); pal.push([1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))); } k = idx.get(c); }
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) out[(y * scale + dy) * W + x * scale + dx] = k;
  }
  return { out, pal, W, H };
}
function writeGif(name, frames, w, h, scale, delay = 140) {
  // 전 프레임 공통 팔레트
  const all = new Set(); frames.forEach((f) => f.forEach((c) => c && all.add(c)));
  const pal = [[0, 0, 0], ...[...all].map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)))];
  if (pal.length > 256) throw new Error('팔레트 초과 ' + name);
  const map = new Map([...all].map((c, i) => [c, i + 1]));
  const W = w * scale, H = h * scale;
  const g = GIFEncoder();
  frames.forEach((px, fi) => {
    const out = new Uint8Array(W * H);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = px[y * w + x] ? map.get(px[y * w + x]) : 0;
      for (let dy = 0; dy < scale; dy++) out.fill(k, (y * scale + dy) * W + x * scale, (y * scale + dy) * W + x * scale + scale);
    }
    g.writeFrame(out, W, H, { palette: pal, delay, transparent: true, transparentIndex: 0, repeat: 0 });
  });
  g.finish();
  writeFileSync(join(OUT, name), g.bytes());
}
function writePng(path, px, w, h, scale) {
  const png = new PNG({ width: w * scale, height: h * scale });
  for (let y = 0; y < h * scale; y++) for (let x = 0; x < w * scale; x++) {
    const c = px[Math.floor(y / scale) * w + Math.floor(x / scale)]; const o = (y * w * scale + x) * 4;
    if (c) { png.data[o] = parseInt(c.slice(1, 3), 16); png.data[o + 1] = parseInt(c.slice(3, 5), 16); png.data[o + 2] = parseInt(c.slice(5, 7), 16); png.data[o + 3] = 255; }
  }
  writeFileSync(path, PNG.sync.write(png));
}

const FRAMES = 8;
const asSprite = (o) => ({ s: { px: o.px, w: o.w, h: o.h }, x: 0, y: 0 });
const place = (o, x, y) => ({ s: { px: o.px, w: o.w, h: o.h }, x, y });
const ground = [grass(4, 40), grass(15, 42), grass(40, 41), grass(46, 30), grass(82, 40), grass(85, 33), grass(2, 33), grass(76, 42), grass(38, 22)];
const flowers = [flower(5, 36), flower(83, 36, '#f3c9c2'), flower(42, 38)];

// 보호자 스티커 (프레임별)
const ownerSt = (f) => { const o = owner(f, { blink: f === 5 }); return sticker(o.px, o.w, o.h); };
// 강아지 스티커 (왼쪽을 보도록 뒤집음)
const dogSt = (id, color, f, opt) => { const d = sideDog(id, color, f, opt); const fl = flipPx(d.px, d.w, d.h); return sticker(fl, d.w, d.h); };
const dogStR = (id, color, f, opt) => { const d = sideDog(id, color, f, opt); return sticker(d.px, d.w, d.h); };

for (const { id, color, key } of VARIANTS) {
  // 장면 88×44
  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const o = ownerSt(f);
    const d = dogSt(id, color, f, { blink: f === 2, tongue: f >= 4 && f % 2 === 0 });
    const pt = petal(66 - f * 4, 3 + f * 2 + (f % 2));
    frames.push(compose(88, 44, noise, [shadow(25, 40.5, 13, 1.8), shadow(65, 41, 12, 1.6), ...ground, ...flowers, place(o, 8, 44 - o.h - 1), place(d, 44, 44 - d.h), pt]));
  }
  writeGif(`scene-${key}.gif`, frames, 88, 44, 5, 150);
  if (key === 'mix-cream' || key === 'shiba-red' || key === 'poodle-black') writePng(join(PREV, `scene-${key}.png`), frames[0], 88, 44, 6);
  // 썸네일 (스티커만, 배경 투명) 42×36
  const tf = [];
  for (let f = 0; f < 4; f++) { const d = dogStR(id, color, f, { blink: f === 3 }); tf.push(d.px); }
  const t0 = dogStR(id, color, 0);
  writeGif(`dog-${key}.gif`, tf, t0.w, t0.h, 2, 180);
}

// 문 앞 강아지 48×36
{
  const frames = [];
  for (let f = 0; f < 4; f++) { const d = dogStR('mix', 'cream', f, { blink: f === 3, tongue: f % 2 === 0 }); frames.push(compose(56, 40, noise, [shadow(20, 37, 12, 1.4), { s: door(), x: 38, y: 7 }, grass(50, 37), place(d, 0, 40 - d.h + 1)])); }
  writeGif('door.gif', frames, 56, 40, 4, 170);
  writePng(join(PREV, 'door.png'), frames[0], 56, 40, 6);
}

// 파비콘: 시바 머리
{
  const d = sideDog('shiba', 'red', 0);
  const crop = new Array(32 * 32).fill(null);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const sx = Math.floor(x / 2) + 17, sy = Math.floor(y / 2) + 4; crop[y * 32 + x] = d.px[sy * d.w + sx] ?? null; }
  writePng(join(ROOT, 'public', 'favicon.png'), crop, 32, 32, 2);
}
// OG 이미지는 글자가 들어가므로 브라우저에서 만든다: 개발 서버에서 /scripts/og.html
console.log('픽셀 빌드 완료');
