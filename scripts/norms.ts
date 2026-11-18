// 무작위 생년월일시로 왜곡 원점수 분포를 만들어 src/engine/norms.json 에 저장한다.
// 실행: npx vite-node scripts/norms.ts [표본수]
import { writeFileSync } from 'node:fs';
import { computeChart } from '../src/saju/calc';
import { analyze } from '../src/saju/analysis';
import { rawScores, DIST_ORDER, readDistortions } from '../src/engine/distortion';

const N = Number(process.argv[2] ?? 20000);
let seed = 20261112;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const vals: Record<string, number[]> = Object.fromEntries(DIST_ORDER.map((d) => [d, []]));
const samples: ReturnType<typeof analyze>[] = [];
for (let i = 0; i < N; i++) {
  const y = 1955 + Math.floor(rnd() * 55), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
  const known = rnd() > 0.15;
  const c = computeChart({ y, m, d, hh: known ? Math.floor(rnd() * 24) : null, mm: known ? Math.floor(rnd() * 60) : null, calendar: 'solar', gender: rnd() > 0.5 ? 'f' : 'm' });
  const a = analyze(c);
  samples.push(a);
  const r = rawScores(a);
  for (const id of DIST_ORDER) vals[id].push(r[id]);
}
const out: Record<string, number[]> = {};
for (const id of DIST_ORDER) {
  const v = vals[id].sort((x, y) => x - y);
  out[id] = Array.from({ length: 101 }, (_, i) => Math.round(v[Math.min(v.length - 1, Math.floor((i / 100) * (v.length - 1)))] * 100) / 100);
}
writeFileSync(new URL('../src/engine/norms.json', import.meta.url), JSON.stringify(out));
console.log('norms 저장', N);

// 상위 1위 분포 확인 (norms 반영 후 다시 실행하면 의미 있음)
const top: Record<string, number> = {};
for (const a of samples.slice(0, 5000)) { const r = readDistortions(a, null); top[r[0].id] = (top[r[0].id] ?? 0) + 1; }
console.log('1위 분포', top);
