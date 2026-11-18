// AI 문체로 흐르기 쉬운 표현을 잡는다. 걸리면 빌드를 멈춘다.
// 검사 대상: src/content/*.ts 의 문자열, src/report/render.ts 의 한글 문자열, 루트 *.html 본문
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
import { RULES } from './tone-rules.mjs';

const items = [];
const lit = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
const fromTs = (file) => {
  const src = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const m of src.matchAll(lit)) {
    const s = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ');
    if (/[가-힣]/.test(s)) items.push([file.replace(ROOT + '/', ''), s.trim()]);
  }
};
for (const f of readdirSync(join(ROOT, 'src/content')).filter((f) => f.endsWith('.ts'))) fromTs(join(ROOT, 'src/content', f));
{
  // 관리자 페이지에서 고친 문구
  const ov = JSON.parse(readFileSync(join(ROOT, 'src/content/overrides.json'), 'utf8'));
  for (const [k, v] of Object.entries(ov)) for (const s of [v].flat()) if (typeof s === 'string') items.push([`overrides.json ${k}`, s]);
}
{
  // 렌더러는 코드와 섞여 있으므로 태그 사이 글자와 작은따옴표 문자열만 본다
  const src = readFileSync(join(ROOT, 'src/report/render.ts'), 'utf8');
  for (const m of src.matchAll(/>([^<>{}`]*[가-힣][^<>{}`]*)</g)) items.push(['src/report/render.ts', m[1].trim()]);
  for (const m of src.matchAll(/'([^'\n]*[가-힣][^'\n]*)'/g)) items.push(['src/report/render.ts', m[1].trim()]);
}
for (const f of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const txt = readFileSync(join(ROOT, f), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<!doctype[^>]*>/i, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '\n');
  for (const line of txt.split('\n')) if (/[가-힣]/.test(line)) items.push([f, line.trim()]);
}
for (const f of readdirSync(join(ROOT, 'partials'))) {
  const txt = readFileSync(join(ROOT, 'partials', f), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '\n');
  for (const line of txt.split('\n')) if (/[가-힣]/.test(line)) items.push([`partials/${f}`, line.trim()]);
}

let bad = 0;
for (const [file, s] of items) for (const [re, label] of RULES) if (re.test(s)) { console.log(`✗ ${file}: ${label} — ${s.slice(0, 90)}`); bad++; }
if (bad) { console.log(`\n톤 린트: ${bad}건`); process.exit(1); }
console.log(`톤 린트: 통과 (${items.length}개 문자열)`);
