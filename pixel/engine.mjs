// 아주 작은 픽셀 엔진: 도형 → 파트 마스크 → 명암 → 외곽선 → 색 배열
export class Sprite {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.part = new Array(w * h).fill(null);   // 파트 이름
    this.px = new Array(w * h).fill(null);     // 최종 색 (hex)
    this.parts = {};                            // 이름 → {base, light, shade, edge}
    this.order = [];
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  def(name, o) { this.parts[name] = { light: o.base, shade: o.base, edge: null, flat: false, ...o }; if (!this.order.includes(name)) this.order.push(name); return this; }
  mark(x, y, name) { x = Math.round(x); y = Math.round(y); if (this.inside(x, y)) this.part[y * this.w + x] = name; }
  ellipse(cx, cy, rx, ry, name, rot = 0) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const R = Math.ceil(Math.max(rx, ry)) + 1;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = dx * c + dy * s, v = -dx * s + dy * c;
      if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) this.mark(x, y, name);
    }
    return this;
  }
  rect(x0, y0, w, h, name) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.mark(x, y, name); return this; }
  poly(pts, name) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = 0; x < this.w; x++) {
        const px = x + 0.5, py = y + 0.5; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.mark(x, y, name);
      }
    }
    return this;
  }
  /** 두께 있는 선 (꼬리, 땋은 머리) */
  stroke(pts, r, name) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
      for (let k = 0; k <= n; k++) { const t = k / n; this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, name); }
    }
    return this;
  }
  erase(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (fn(x, y)) this.part[y * this.w + x] = null; return this; }
  P(x, y) { return this.inside(x, y) ? this.part[y * this.w + x] : null; }

  /** 명암·외곽선을 칠해 px 확정 */
  render(outline, { lightDir = [-1, -1] } = {}) {
    this.outlineColor = outline;
    const { w, h } = this;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = this.P(x, y); if (!p) continue;
      const d = this.parts[p];
      let col = d.base;
      if (!d.flat) {
        const sh = this.P(x - lightDir[0], y - lightDir[1]) !== p || this.P(x, y + 2) !== p && this.P(x, y + 1) === p && d.deep;
        const li = this.P(x + lightDir[0], y + lightDir[1]) !== p && this.P(x, y - 1) !== p;
        if (sh) col = d.shade; else if (li) col = d.light;
      }
      // 다른 파트와 맞닿은 경계
      if (d.edge) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const q = this.P(x + dx, y + dy);
          if (q && q !== p && this.order.indexOf(q) < this.order.indexOf(p) && !(d.edgeSkip || []).includes(q)) { col = d.edge; break; }
        }
      }
      this.px[y * w + x] = col;
    }
    // 바깥 외곽선
    if (outline) {
      const add = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (this.P(x, y)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const q = this.P(x + dx, y + dy);
          if (q && !this.parts[q].noOutline) { add.push([x, y, this.parts[q].outline || outline]); break; }
        }
      }
      for (const [x, y, c] of add) this.px[y * w + x] = c;
    }
    return this;
  }
  dot(x, y, col) { if (this.inside(x, y)) this.px[y * this.w + x] = col; return this; }
  dots(list, col) { for (const [x, y] of list) this.dot(x, y, col); return this; }
}

/** 여러 스프라이트를 배경 위에 합성 */
export function compose(w, h, bg, layers) {
  const out = new Array(w * h).fill(null);
  if (bg) for (let i = 0; i < out.length; i++) out[i] = typeof bg === 'function' ? bg(i % w, Math.floor(i / w)) : bg;
  for (const { s, x: ox, y: oy } of layers) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const c = s.px[y * s.w + x]; if (!c) continue;
      const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      out[Y * w + X] = c;
    }
  }
  return out;
}

/** 렌더된 픽셀 위에 모양 안쪽만 덧칠 (무늬). parts 를 주면 그 파트에만 */
export function paint(s, test, color, parts = null) {
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const p = s.P(x, y);
    if (!p || (parts && !parts.includes(p))) continue;
    if (s.px[y * s.w + x] === s.outlineColor) continue;
    if (test(x + 0.5, y + 0.5)) s.px[y * s.w + x] = typeof color === 'function' ? color(s.px[y * s.w + x]) : color;
  }
}
export const inEllipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** 좌우 뒤집기 (px 배열 기준) */
export function flipPx(px, w, h) {
  const out = new Array(w * h).fill(null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + (w - 1 - x)] = px[y * w + x];
  return out;
}

/** 스티커 테두리: 실루엣을 r 만큼 흰색으로 넓히고 바깥 1px 옅은 회색 */
export function sticker(px, w, h, r = 2, white = '#ffffff', rim = '#d9cfbf', pad = 3) {
  const W = w + pad * 2, H = h + pad * 2;
  const src = new Array(W * H).fill(null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) src[(y + pad) * W + x + pad] = px[y * w + x];
  const dist = (k) => {
    const out = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (src[y * W + x]) { out[y * W + x] = true; continue; }
      outer: for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) {
        if (dx * dx + dy * dy > k * k + 0.5) continue;
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H && src[Y * W + X]) { out[y * W + x] = true; break outer; }
      }
    }
    return out;
  };
  const a = dist(r), b = dist(r + 1);
  const out = src.slice();
  for (let i = 0; i < out.length; i++) if (!out[i]) out[i] = a[i] ? white : b[i] ? rim : null;
  return { px: out, w: W, h: H };
}
