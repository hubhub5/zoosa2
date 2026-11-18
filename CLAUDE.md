# zoosa2 — 되풀이사주 (보호자사주 복사본에서 출발)

이 폴더는 2026-11-18에 **보호자사주**(`~/Downloads/zoosa`, https://hubhub5.github.io/zoosa/, 저장소 hubhub5/zoosa)를 통째로 복사해 만든 별도 프로젝트다.
보호자사주는 그대로 운영 중이다. 여기서는 2026-11-18부터 **되풀이사주**(일반 대운 사주 + 생각 버릇 리딩)로 바꿨다. 강아지·픽셀 그림은 전부 뺐다.

- 저장소: https://github.com/hubhub5/zoosa2 (main 에 push 하면 Actions 가 테스트 → 빌드 → GitHub Pages 배포)
- 사이트: https://hubhub5.github.io/zoosa2/
- **원본(`~/Downloads/zoosa`)은 건드리지 않는다.** 원본 수정 요청이 아니면 그 폴더·저장소·서버에 쓰지 않는다.

## 사용자

- 한국어로 답한다. 비개발자라서 용어 대신 쉬운 말로, 결과 위주로 설명한다.
- AI 티 나는 글을 아주 싫어한다. 줄글 대신 숫자·단어·대사·장면 같은 짧은 칸으로 쓴다. 느낌표·이모지·'여정'·'특별한 인연' 같은 표현 금지 (`npm run lint` 가 막음). 사용자가 직접 준 문장은 그대로 넣는다.
- 디자인: archive-design 계열 (나눔스퀘어 네오, 자간 -0.07em, 흑백+노랑 포인트, 1px 선·격자, 고정폭 메타).
- 판매자 정보: 상호 놀이댕산, 문의 study_4ever@naver.com (`src/config.ts`).
- 그로블·Cloudflare·GitHub 계정 설정 화면은 사용자가 직접 누른다. 비밀값(웹훅 키, 토큰)은 채팅에 붙이지 말고 클립보드 → `pbpaste` 로 넣는다.
- 이용자에게는 사이트 주소를 준다. 그로블 결제 링크를 직접 주지 않는다 (사이트를 거쳐야 ref 가 붙어 자동으로 열린다).

## 되풀이사주가 하는 일

생년월일시만 넣으면, 대운·세운이 원국을 건드린 해 중 "같은 장면이 되풀이된 해"를 연도로 찍고, 그해 장면을 단정형으로 읽어 준다. 01–03장 무료, 04–09장 13,900원.
01 사주 여덟 글자 · 02 10년씩 끊어 본 인생(되풀이된 해 표시) · 03 이미 몇 번 겪은 일(고리 4칸 + 되풀이된 해, 최근 해만 문장 공개 + 체크리스트) · 04 생각 버릇 10 · 05 부딪히는 자리(갈등 6 + 되풀이된 해 전부 + 다음 차례) · 06 버티는 방식(대처 6) · 07 지금/다음 10년 · 08 앞으로 10년 · 09 저장 카드.
리딩 톤: 인지왜곡·CBT 용어는 앞세우지 않고 사주 근거로 말한다. 신점처럼 연도·계절·상대·장면을 단정형으로. 문체 기준은 `docs/voice.md` (Moist Notes 548편에서 뽑음).
입력값은 서버로 안 가고 주소 해시(#)에 담겨 브라우저에서 계산·렌더링한다.

## 구조

- 정적 사이트: Vite + TypeScript, `base: './'`. 페이지 HTML 은 루트(`index.html`, `report.html`, `sample.html`, `unlock.html`, 약관·환불·개인정보, 숨은 주소 `full-e31f9f43f85e.html`(전체 예시), `edit-b1ba3516.html`(관리자 문구 편집)). 공통 머리·꼬리는 `partials/`.
- `src/saju/` 만세력 (lunar-javascript, 진태양시 −30분, 1954–61 표준시, 서머타임), 십성·오행·신강도·운 점수 → **새 컨셉에서도 그대로 재사용할 핵심**
- `src/engine/` 공통 특징·분위(`features.ts`), 생각 버릇(`distortion.ts`), 대처(`coping.ts`), 갈등(`conflict.ts`), 되풀이된 해(`repeat.ts`: 세운에서 1위 버릇이 튄 정도 + 일지·월지 충형원진 + 운 점수로 고르고, 상대(slot)는 세운 십성·일지·성별로). 분위표 `norms.json` 은 `npm run norms` 로 셋 다 다시 만든다
- `src/content/` 문구 데이터. `events.ts`(버릇 × 상대 60문장, 체크리스트), `coping.ts`, `conflict.ts`, `distortions.ts`, `verdict.ts`(표지). `overrides.json` 은 관리자 편집 페이지가 커밋하는 덮어쓰기 값 (강아지 시절 값은 비웠음)
- `src/report/model.ts` 입력 → 리포트 모델 (`decodeInputs` 가 해시 → 입력값), `render.ts` HTML
- `src/unlock.ts` 잠금 해제: 해제코드(해시 비교) + 자동 결제 확인(ref/rid, 아래)
- `scripts/` 문체 검사·코드 해시·분위표·OG 이미지(`npm run dev` 후 `/scripts/og.html`)
- `worker/` 결제 확인 서버 (Cloudflare Workers + D1)

명령: `npm run dev` · `npm test`(무작위 300건 렌더링 포함) · `npm run lint` · `npm run build` · `npm run norms`. 서버 테스트도 `npm test` 에 포함.

## 결제 (원본에서 쓰는 방식, 여기서는 아직 꺼져 있음)

1. 리포트마다 랜덤 ref(`zs_...`) → 그로블 **결제창** 링크 뒤에 `?ref=` (판매 페이지 링크는 ref 가 사라져서 안 됨)
2. 그로블 웹훅 `payment.completed` 의 `data.object.sellerReference` 로 ref 가 돌아옴 → Worker 가 서명 확인(HMAC-SHA256, `${X-Groble-Timestamp}.${raw}`) 후 D1 에 기록. 구매자 번호·메일은 HMAC 해시로만
3. 그로블 '결제 후 이동 페이지' = `<사이트>/unlock.html?paid=1` → `/check {ref, rid}` 로 확인 후 리포트 열림. rid = 입력값 해시라 결제 1건 = 리포트 1개
4. 다른 기기: 열쇠 링크(`&k=`) 또는 "이미 결제했어요" + 결제한 번호/메일 → `/find`
5. `payment.refunded`(환불)는 sellerReference 가 없어서 merchantUid 로 찾아 잠근다

D1 을 쓰는 이유: KV 무료 한도가 하루 쓰기 1천이라 부족. D1 은 하루 10만 행.

## 원본과 분리해 둔 것 (복사할 때 바꾼 것)

두 사이트는 같은 도메인(hubhub5.github.io)이라 브라우저 저장소를 같이 쓴다. 그래서:
- localStorage/sessionStorage 키 접두어 `zoosa.` → `zoosa2.`, 코드 해시 소금 `zoosa:` → `zoosa2:`, rid 소금 `zoosa2-rid:`
- `src/config.ts`: `grobleUrl`·`groblePayUrl`·`paidApi` 비움, `unlockHashes` 비움(원본 코드로는 안 열림), `repo: 'hubhub5/zoosa2'`
- `worker/wrangler.toml`: 이름 `zoosa2-paid`, D1 `zoosa2-paid`, `database_id = "REPLACE_D1"` (아직 안 만듦). **이 이름을 `zoosa-paid` 로 되돌려 deploy 하면 원본 결제 서버를 덮어쓴다.**
- 비밀값 파일(`worker/.shapes_key`, `.dev.vars`)은 복사 안 함. Git 기록은 새로 시작 (원본 기록은 hubhub5/zoosa 에 있음)

## 새 사이트 판매 시작할 때 할 일

1. (완료 2026-11-18) 문구·화면·`src/config.ts` brand `되풀이사주`, 13,900원, og 이미지, 약관·환불·개인정보. 이름은 임시라 바꾸려면 config·html 제목·partials/top.html·scripts/og.html
2. 그로블에서 새 상품 + **결제창** 만들기 (사용자가 직접). 이동 페이지: `https://hubhub5.github.io/zoosa2/unlock.html?paid=1`
3. 서버: `npx -y wrangler@4.86.0 whoami` 로 로그인 확인(계정 study_4ever) → `bash worker/setup.sh` (D1 생성, 배포, SHAPES_KEY·HASH_PEPPER) → 주소는 `https://zoosa2-paid.study-4ever.workers.dev`
4. 그로블 웹훅 등록: URL `<서버>/hook`, 이벤트 결제 완료·결제 취소 완료. 키는 사용자가 복사 → `cd worker && pbpaste | npx -y wrangler@4.86.0 secret put GROBLE_SECRET` → 클립보드 비우기
5. `src/config.ts` 에 `grobleUrl`·`groblePayUrl`(결제창), `paidApi` 채우고 push
6. 확인: 그로블 테스트 웹훅 → `<서버>/shapes/<worker/.shapes_key>` 에 기록되는지, 실제 결제·환불 한 번

서버 코드는 GitHub push 로 안 바뀐다: `cd worker && npx -y wrangler@4.86.0 deploy`. compatibility_date 는 wrangler 4.86 한계로 2026-05-01.

## 원본에서 겪은 것 (같은 실수 피하기)

- 관리자 편집 페이지가 원격에 커밋하므로 push 전에 `git pull --rebase`
- `vite preview` 는 base './' 라 `/zoosa2/` 가 아니라 루트에서 열린다
- 카톡 미리보기는 캐시가 오래 남는다: og 이미지 주소에 `?v=날짜` 를 바꾸고 카카오 공유 디버거에서 초기화
- 문구는 반드시 `npm run lint` 통과. 사용자가 "AI 같다"고 하면 사용자가 준 문장 그대로 바꾸고 관련 부분 전부 찾아 고친다
