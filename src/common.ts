import './styles/tokens.css';
import './styles/base.css';
import './styles/doc.css';
import './styles/app.css';
import { CONFIG } from './config';

export function initCommon() {
  const root = document.documentElement;
  document.querySelector('.theme-btn')?.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('zoosa2.theme', root.dataset.theme); } catch { /* 무시 */ }
    document.dispatchEvent(new CustomEvent('themechange'));
  });
  const mb = document.querySelector<HTMLButtonElement>('.menu-btn');
  mb?.addEventListener('click', () => {
    const nav = document.getElementById('nav')!;
    nav.classList.toggle('open');
    mb.setAttribute('aria-expanded', String(nav.classList.contains('open')));
  });
  const s = document.querySelector('[data-seller]');
  if (s) s.textContent = `${CONFIG.seller} · 문의 ${CONFIG.contact} · 결제 대행 그로블(Groble)`;
}
