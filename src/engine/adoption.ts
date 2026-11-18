import type { Chart, DatePillars } from '../saju/calc';
import { datePillars, daeunAt } from '../saju/calc';
import type { Analysis } from '../saju/analysis';
import { luckScore, relationsWith } from '../saju/analysis';
import { type TenGod, type TgGroup, TG_GROUP, tenGod, mainHidden, isYeokma, isStemHap } from '../saju/constants';

export type Route = 'shop' | 'shelter' | 'rescue' | 'family' | 'etc' | '';
export type BranchId = 'move' | 'work' | 'relation' | 'low' | 'restart' | 'chance' | 'rescue';

export interface AdoptionInput {
  y: number; m: number; d: number | null; // 일을 모르면 null
  route: Route;
  sick: boolean;
}

export interface Evidence { label: string; value: string }

export interface AdoptionResult {
  pillars: DatePillars;
  dayKnown: boolean;
  yearTg: TenGod; yearBranchTg: TenGod;
  monthTg: TenGod; monthBranchTg: TenGod;
  daeunIdx: number; daeunYear: number; daeunLen: number;
  daeunTurn: boolean;      // 대운 교체 전후 1년
  score: number;           // 그해 세운 점수
  ranked: { id: BranchId; v: number }[];
  primary: BranchId;
  secondary: BranchId[];
  evidence: Evidence[];
  dPlus: number;
}

export function readAdoption(c: Chart, a: Analysis, inp: AdoptionInput, today: Date): AdoptionResult {
  const dd = inp.d ?? 15;
  const pillars = datePillars(inp.y, inp.m, dd);
  const ds = c.day.s;
  const yTg = tenGod(ds, pillars.year.s), yBTg = tenGod(ds, mainHidden(pillars.year.b));
  const mTg = tenGod(ds, pillars.month.s), mBTg = tenGod(ds, mainHidden(pillars.month.b));
  const groups: [TgGroup, number][] = [
    [TG_GROUP[yTg], 1.2], [TG_GROUP[yBTg], 1.0], [TG_GROUP[mTg], 0.8], [TG_GROUP[mBTg], 0.7],
  ];
  const g = (k: TgGroup) => groups.filter(([x]) => x === k).reduce((s, [, w]) => s + w, 0);

  const relY = relationsWith(c, pillars.year);
  const relM = relationsWith(c, pillars.month);
  const has = (rel: typeof relY, kind: string, w?: string) => rel.some((r) => r.kind === kind && (!w || r.with === w));

  const du = daeunAt(c, inp.y);
  const daeunIdx = du?.idx ?? 0;
  const daeunYear = du ? inp.y - du.startYear + 1 : inp.y - c.solar.y + 1;
  const daeunTurn = c.daeun.some((x) => Math.abs(x.startYear - inp.y) <= 1);
  const score = luckScore(a, c, pillars.year);

  const s: Record<BranchId, number> = { move: 0, work: 0, relation: 0, low: 0, restart: 0, chance: 0, rescue: 0 };
  // 이동·독립
  if (isYeokma(pillars.year.b)) s.move += 1;
  if (isYeokma(pillars.month.b)) s.move += 0.8;
  if (has(relY, '충', 'day') || has(relY, '충', 'year')) s.move += 1.6;
  if (has(relM, '충', 'day')) s.move += 0.9;
  if (daeunTurn) s.move += 1.1;
  // 일·돈
  s.work += g('wealth') * 1.1 + g('power') * 0.7;
  // 관계
  s.relation += g('self') * 1.1;
  if (has(relY, '합', 'day') || has(relM, '합', 'day')) s.relation += 0.9;
  if (has(relY, '원진') || has(relY, '형', 'day')) s.relation += 0.7;
  if (isStemHap(pillars.year.s, ds)) s.relation += 0.6;
  // 마음 바닥
  s.low += (yTg === 'pyeongwan' ? 1.2 : 0) + (yBTg === 'pyeongwan' ? 0.8 : 0) + (yTg === 'pyeonin' ? 0.8 : 0);
  if (!a.strong) s.low += g('power') * 0.5;
  if (score < 42) s.low += 1.2;
  if (has(relY, '형') || has(relY, '원진')) s.low += 0.5;
  // 다시 시작
  s.restart += g('output') * 1.2;
  if (score >= 62) s.restart += 0.6;
  // 우연
  s.chance += g('resource') * 0.9;
  if (isStemHap(pillars.month.s, ds)) s.chance += 0.6;
  // 경로
  switch (inp.route) {
    case 'shop': s.move += 0.6; s.work += 0.6; break;
    case 'shelter': s.restart += 0.8; s.chance += 0.6; break;
    case 'rescue': s.rescue += 3; s.chance += 1.2; break;
    case 'family': s.chance += 1.4; s.relation += 0.6; break;
  }
  if (inp.sick) s.rescue += 4;

  const ranked = (Object.keys(s) as BranchId[]).map((id) => ({ id, v: Math.round(s[id] * 10) / 10 })).sort((x, y) => y.v - x.v);
  const primary = ranked[0].id;
  const secondary = ranked.slice(1).filter((r) => r.id !== 'rescue').slice(0, 2).map((r) => r.id);

  const evidence: Evidence[] = [
    { label: '그해', value: `${inp.y}` },
    { label: '세운', value: `${pillars.year.s},${pillars.year.b}` },
    { label: '월운', value: `${pillars.month.s},${pillars.month.b}` },
  ];
  const start = Date.UTC(inp.y, inp.m - 1, dd);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dPlus = Math.max(0, Math.round((now - start) / 86400000));

  return {
    pillars, dayKnown: inp.d !== null,
    yearTg: yTg, yearBranchTg: yBTg, monthTg: mTg, monthBranchTg: mBTg,
    daeunIdx, daeunYear, daeunLen: 10, daeunTurn, score,
    ranked, primary, secondary, evidence, dPlus,
  };
}
