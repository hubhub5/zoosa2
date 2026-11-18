// 무작위 생년월일시로 원점수 분포를 만들어 src/engine/norms.json 에 저장한다 (생각 버릇 · 대처 · 갈등).
// 실행: npm run norms  (= vite-node scripts/norms.ts 20000)
import { writeFileSync } from 'node:fs';
import { computeChart } from '../src/saju/calc';
import { analyze } from '../src/saju/analysis';
import { features } from '../src/engine/features';
import { DIST_ORDER, DIST_RAW, readDistortions } from '../src/engine/distortion';
import { COPE_ORDER, COPE_RAW, readCoping } from '../src/engine/coping';
import { CONFLICT_ORDER, CONFLICT_RAW, readConflict } from '../src/engine/conflict';

const N = Number(process.argv[2] ?? 20000);
let seed = 20261112;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const RAW = { ...DIST_RAW, ...COPE_RAW, ...CONFLICT_RAW } as Record<string, (f: ReturnType<typeof features>) => number>;
const IDS = [...DIST_ORDER, ...COPE_ORDER, ...CONFLICT_ORDER];
const vals: Record<string, number[]> = Object.fromEntries(IDS.map((d) => [d, []]));
const samples: ReturnType<typeof analyze>[] = [];
for (let i = 0; i < N; i++) {
  const y = 1955 + Math.floor(rnd() * 55), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
  const known = rnd() > 0.15;
  const c = computeChart({ y, m, d, hh: known ? Math.floor(rnd() * 24) : null, mm: known ? Math.floor(rnd() * 60) : null, calendar: 'solar', gender: rnd() > 0.5 ? 'f' : 'm' });
  const a = analyze(c);
  samples.push(a);
  const f = features(a);
  for (const id of IDS) vals[id].push(RAW[id](f));
}
const out: Record<string, number[]> = {};
for (const id of IDS) {
  const v = vals[id].sort((x, y) => x - y);
  out[id] = Array.from({ length: 101 }, (_, i) => Math.round(v[Math.min(v.length - 1, Math.floor((i / 100) * (v.length - 1)))] * 100) / 100);
}
writeFileSync(new URL('../src/engine/norms.json', import.meta.url), JSON.stringify(out));
console.log('norms 저장', N);

// 1위 분포 (norms 반영 후 다시 실행하면 의미 있음)
for (const [name, fn] of [['버릇', readDistortions], ['대처', readCoping], ['갈등', readConflict]] as const) {
  const top: Record<string, number> = {};
  for (const a of samples.slice(0, 5000)) { const r = fn(a, null); top[r[0].id] = (top[r[0].id] ?? 0) + 1; }
  console.log(name, '1위 분포', top);
}
