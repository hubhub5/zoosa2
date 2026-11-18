// 확인용: 모든 견종을 한 장에 (pixel/preview/breeds.png)
import { writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';
import { sideDog, VARIANTS } from './breeds.mjs';
import { sticker } from './engine.mjs';
mkdirSync('pixel/preview', { recursive: true });
const cols = 8, cw = 44, ch = 38, rows = Math.ceil(VARIANTS.length / cols);
const W = cols * cw, H = rows * ch, S = 5;
const px = new Array(W * H).fill('#efe7d8');
VARIANTS.forEach(({ id, color }, i) => {
  const d = sideDog(id, color, 0);
  const st = sticker(d.px, d.w, d.h);
  const ox = (i % cols) * cw + 1, oy = Math.floor(i / cols) * ch + 1;
  for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) { const c = st.px[y * st.w + x]; if (c) px[(oy + y) * W + ox + x] = c; }
});
const png = new PNG({ width: W * S, height: H * S });
for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) { const c = px[Math.floor(y / S) * W + Math.floor(x / S)]; const o = (y * W * S + x) * 4; png.data[o] = parseInt(c.slice(1, 3), 16); png.data[o + 1] = parseInt(c.slice(3, 5), 16); png.data[o + 2] = parseInt(c.slice(5, 7), 16); png.data[o + 3] = 255; }
writeFileSync('pixel/preview/breeds.png', PNG.sync.write(png));
console.log(VARIANTS.length);
