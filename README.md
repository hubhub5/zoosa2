# zoosa2 · 되풀이사주 (보호자사주 복사본에서 출발)

> 2026-11-18 hubhub5/zoosa 를 복사해 시작. 결제·서버 설정은 비어 있다. 판매 시작 전 할 일은 `CLAUDE.md` 참고.

보호자의 대운(10년 단위) 위에 반려견 입양일을 찍어 보는 리포트. 정적 사이트(GitHub Pages) + 그로블 결제 + 해제코드.

## 판매 전에 할 일

1. **그로블 상품 만들기** (디지털 콘텐츠, 9,900원)
   - 전달 내용(구매자에게 보이는 안내)에 아래 두 줄을 넣는다.
     ```
     해제 링크: https://<아이디>.github.io/<레포>/unlock.html?code=<코드>
     코드: <코드>
     ```
   - 링크에 `?code=`를 붙이면 입력칸이 미리 채워진다.
2. **코드 바꾸기**: 코드 원문은 저장소에 절대 적지 않는다(해시만). 코드를 바꿀 때:
   ```
   node scripts/hash-code.mjs 새코드
   ```
   나온 해시를 `src/config.ts`의 `unlockHashes`에 넣는다.
3. **`src/config.ts` 채우기**: `grobleUrl`(상품 주소), `contact`(문의 메일), `seller`(판매자 이름).
4. **배포**: GitHub에 올리고 Settings → Pages → Source를 "GitHub Actions"로. `main`에 push하면 테스트 → 빌드 → 배포.
   - 커스텀 도메인을 쓰면 `.github/workflows/pages.yml`의 `SITE_URL`을 도메인으로 바꾼다 (OG 이미지 절대 주소용).

## 코드 교체 주기

- 정적 사이트라 코드가 공유되거나 JS를 뜯어보면 열릴 수 있다. 9,900원 상품에서는 감수하고, 한 달에 한 번쯤 코드를 바꾼다.
- 바꿀 때는 새 해시를 **추가**하고 예전 해시는 2~4주 뒤에 지운다. 이미 해제한 브라우저도 예전 해시를 지우면 다시 잠기므로, 잠긴 구매자 문의가 오면 새 코드를 보내 준다.

## 문구 고치기 (관리자 편집 페이지)

`/edit-b1ba3516.html` (사이트 어디에도 링크 없음, noindex). 리포트 문구를 장별로 보여 주고, 고친 값은 `src/content/overrides.json`에 커밋된다 → Actions가 다시 배포.

- 저장에는 GitHub fine-grained 토큰이 필요 (zoosa2 저장소만, Contents 읽기·쓰기 + Actions 읽기). 탭을 닫으면 토큰은 지워진다.
- `?draft`를 붙인 리포트 주소(예: `sample.html?draft`)는 저장 전 문구로 미리보기.
- 리포트를 깨는 값(빈 칸, 줄 수 부족, `→` 빠진 '바뀐 것')은 무시하고 기본 문구를 쓴다. 문체 검사(`scripts/tone-rules.mjs`)는 편집 페이지와 빌드가 같이 쓴다.
- 코드의 기본 문구를 바꿔도 overrides.json에 같은 칸이 있으면 그쪽이 이긴다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm test` | 만세력·리포트 테스트 (무작위 입력 300건 렌더링 포함) |
| `npm run lint` | AI 문체 검사 (`scripts/lint-tone.mjs`) |
| `npm run build` | 문체 검사 후 `dist/` 빌드 |
| `npm run norms` | 인지왜곡 분위 기준표 다시 만들기 (계산식을 바꿨을 때) |

OG 이미지(`public/og.png`)는 글꼴이 들어가서 브라우저에서 만든다: `npm run dev` 후 `/scripts/og.html`을 열면 저장된다.

## 구조

- `src/saju/` 만세력(lunar-javascript 래퍼, 진태양시 −30분, 1954–61 표준시, 서머타임), 십성·오행·신강도·운 점수
- `src/engine/adoption.ts` 입양한 해·달의 운으로 계기 7갈래 점수
- `src/engine/distortion.ts` 원국 비중 → 인지왜곡 10종 원점수 → `norms.json`(2만 명 분위)
- `src/content/` 문구 데이터. 문장을 길게 늘리지 말고 칸에 맞는 짧은 말로
- `src/report/` 모델 조립과 HTML 렌더링

## 문구 원칙

긴 줄글 대신 고정 양식: 숫자, 단어, 실제 말투의 대사, 장면. 느낌표·이모지·'여정'·'특별한 인연' 같은 표현은 `npm run lint`가 막는다.

## 결제 확인 서버 (그로블 웹훅)

`worker/` 는 Cloudflare Workers + D1 에 올린 작은 서버다. 주소(설치 후): https://zoosa2-paid.study-4ever.workers.dev

흐름
- 리포트마다 랜덤 참조값(zs_...)을 만들어 그로블 결제창 링크에 `?ref=` 로 붙인다.
- 결제되면 웹훅 `payment.completed` 의 `sellerReference` 로 돌아오고, 서버가 기록한다 (구매자 번호·메일은 해시로만).
- 그로블 이동 페이지(`unlock.html?paid=1`)로 돌아온 사이트가 `/check {ref, rid}` 로 확인하고 그 리포트를 연다. rid 는 입력값 해시라서 결제 1건 = 리포트 1개(반려동물마다 따로 신청).
- 다른 기기: 결과 링크 복사(열쇠 `&k=` 포함)로 열거나, 같은 정보 입력 후 "이미 결제했어요"에 결제한 번호 → `/find`.
- 환불(결제 취소 완료, `payment.refunded`)이 오면 잠그고, 다음에 리포트를 열 때 브라우저의 열림 표시도 지운다.

관리
- 웹훅 모양 확인: `<서버 주소>/shapes/<worker/.shapes_key 값>` (개인정보 가림)
- 그로블 웹훅 키를 재발급하면: 키 복사 후 `cd worker && pbpaste | npx -y wrangler@4.86.0 secret put GROBLE_SECRET`
- 서버 코드 수정 후: `cd worker && npx -y wrangler@4.86.0 deploy` (GitHub 푸시로는 서버가 안 바뀐다)
- 새 계정으로 옮길 때: `bash worker/setup.sh`
- 무료 한도: D1 하루 쓰기 10만 행. 결제 1건에 몇 행이라 하루 수천 건도 괜찮다.

`src/config.ts` 의 `groblePayUrl`, `paidApi` 를 비우면 예전 코드 방식으로 돌아간다. 코드(지인용·판매용)는 계속 쓸 수 있다.
