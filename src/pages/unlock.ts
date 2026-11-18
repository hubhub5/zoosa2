import { initCommon } from '../common';
import '../styles/form.css';
import { tryUnlock, isUnlocked, lastReport, pendingReport, autoPay, hasRef, checkPaid } from '../unlock';
import { CONFIG } from '../config';

initCommon();
const f = document.querySelector<HTMLFormElement>('[data-code-form]')!;
const msg = document.querySelector<HTMLParagraphElement>('.ul-msg')!;
const input = f.querySelector<HTMLInputElement>('input')!;
document.querySelector<HTMLAnchorElement>('[data-buy]')!.href = CONFIG.grobleUrl;
document.querySelector('[data-contact]')!.textContent = CONFIG.contact;

const goReport = () => {
  const last = lastReport();
  location.href = last ? `./report.html#${last}` : './#form';
};

if (isUnlocked()) {
  msg.className = 'ul-msg mono ok';
  msg.innerHTML = '이미 열려 있어요. <a class="wl" href="#" data-go>리포트로 돌아가기</a>';
  msg.querySelector('[data-go]')!.addEventListener('click', (e) => { e.preventDefault(); goReport(); });
}


const say = (ok: boolean, t: string) => { msg.className = `ul-msg mono ${ok ? 'ok' : 'no'}`; msg.textContent = t; };

/** 코드가 맞으면 열고 리포트로 보낸다 */
async function openWith(v: string) {
  const r = await tryUnlock(v);
  if (r === 'nostore') {
    msg.className = 'ul-msg mono no';
    msg.textContent = '코드는 맞는데 이 브라우저가 저장을 막고 있어요. 시크릿 창이나 앱 안 브라우저면 크롬·사파리로 열어서 다시 넣어 주세요.';
    return;
  }
  if (r === 'ok') {
    msg.className = 'ul-msg mono ok';
    msg.textContent = '열렸어요. 리포트로 갈게요.';
    setTimeout(goReport, 700);
  } else {
    say(false, '코드가 안 맞아요. 오타 없는지 한 번만 봐 주세요.');
    input.select();
  }
}

f.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value.trim();
  if (!v) { say(false, '코드부터 넣어 주세요.'); return; }
  void openWith(v);
});

// 그로블 '결제 후 이동 페이지'로 돌아온 경우 (?paid=1): 결제하러 간 리포트가 결제됐는지 확인하고 연다
if (new URLSearchParams(location.search).has('paid')) void afterPay();

async function afterPay() {
  const report = pendingReport();
  if (!autoPay() || !report || !hasRef(report)) {
    say(false, `결제는 그로블에 기록돼 있어요. 다만 이 브라우저에서 결제한 리포트를 못 찾았어요. 리포트를 만들었던 브라우저에서 리포트를 다시 열면 자동으로 열려요. 그래도 안 되면 ${CONFIG.contact}로 결제 내역 캡처를 보내 주세요.`);
    return;
  }
  say(true, '결제 확인하는 중이에요.');
  // 웹훅이 몇 초 늦게 올 수 있어서 20초 동안 다시 물어본다
  for (let i = 0; i < 10; i++) {
    const r = await checkPaid(report);
    if (r === 'ok') { say(true, '결제 확인됐어요. 리포트로 갈게요.'); setTimeout(() => { location.href = `./report.html#${report}`; }, 600); return; }
    if (r === 'nostore') { say(false, '결제는 확인됐는데 이 브라우저가 저장을 막고 있어요. 시크릿 창이면 일반 창에서 리포트를 다시 열어 주세요.'); return; }
    await new Promise((res) => setTimeout(res, 2000));
  }
  say(false, `결제 확인이 늦어지고 있어요. 1~2분 뒤 리포트를 다시 열면 자동으로 열려요. 계속 안 되면 ${CONFIG.contact}로 결제 내역 캡처를 보내 주세요.`);
}
