// Componentes de interface reutilizados nas telas
import { esc, friendlyError, fmtInt } from './lib/util.js';
import { levelProgress, TIERS } from './data/content.js';

// ---------- carregando ----------
let busy = 0, loaderTimer = null;
function paintLoader() {
  let el = document.getElementById('loader');
  if (busy > 0 && !el && !loaderTimer) {
    loaderTimer = setTimeout(() => {
      loaderTimer = null;
      if (busy > 0 && !document.getElementById('loader')) {
        el = document.createElement('div');
        el.id = 'loader'; el.className = 'loader-api'; el.setAttribute('aria-label', 'Carregando');
        el.innerHTML = '<div class="loader-small"></div><div class="loader-large"></div>';
        document.body.appendChild(el);
      }
    }, 180);
  }
  if (busy === 0) { clearTimeout(loaderTimer); loaderTimer = null; el?.remove(); }
}
export async function withLoading(promise) {
  busy++; paintLoader();
  try { return await promise; } finally { busy--; paintLoader(); }
}

// ---------- avisos ----------
export function toast(msg, type = '') {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), type === 'err' ? 5200 : 3200);
}
export const showError = (e) => { console.error(e); toast(friendlyError(e), 'err'); };

// ---------- confirmação (no lugar de confirm()) ----------
export function confirmDialog(message, okLabel = 'Confirmar') {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'dialog-back';
    back.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true"><p>${esc(message)}</p>
      <div class="row"><button class="btn-pop ghost" data-a="no">Cancelar</button><button class="btn-pop" data-a="yes">${esc(okLabel)}</button></div></div>`;
    const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    back.addEventListener('click', (e) => { if (e.target === back) close(false); const a = e.target.dataset?.a; if (a) close(a === 'yes'); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    back.querySelector('[data-a="yes"]').focus();
  });
}

// ---------- pedaços de HTML ----------
export function xpBar(xp, { small = false } = {}) {
  const p = levelProgress(xp || 0);
  return `<div class="pbar${small ? ' sm' : ''}" role="progressbar" aria-label="XP do nível ${p.level}" aria-valuemin="${p.prev}" aria-valuemax="${p.next}" aria-valuenow="${xp || 0}">
    <div style="width:${p.pct.toFixed(1)}%"></div><span>${fmtInt(xp)} / ${fmtInt(p.next)}</span></div>`;
}

export const medalIcon = (tier, title = '') =>
  `<span class="medal ${TIERS[tier]}" title="${esc(title)}"><img src="/img/trophy.webp" alt="" width="28" height="28" loading="lazy"></span>`;

export const heart = (on) =>
  `<svg viewBox="-4 0 32 32" fill="${on ? '#ff2d2d' : 'none'}" stroke="${on ? '#ff2d2d' : '#fff'}" stroke-width="2" aria-hidden="true"><path d="M18.188 6.094c5.188 0 6.906 6 5.094 9.281-2.781 5.094-11.281 10.5-11.281 10.5s-8.531-5.406-11.281-10.5c-1.813-3.281-0.125-9.281 5.094-9.281 4.813 0 6.031 4.156 6.188 4.781 0.156-0.625 1.375-4.781 6.188-4.781z"/></svg>`;

export const bellIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`;

// quadra desenhada (quando o treino não tem vídeo)
export const court = `<svg class="court" viewBox="0 0 320 180" role="img" aria-label="Quadra de basquete com a bola quicando">
  <rect width="320" height="180" fill="#c8743a"/><g fill="none" stroke="#f3e2c7" stroke-width="2.5">
  <rect x="8" y="8" width="304" height="164"/><line x1="160" y1="8" x2="160" y2="172"/><circle cx="160" cy="90" r="22"/>
  <rect x="8" y="58" width="52" height="64"/><circle cx="60" cy="90" r="18"/><path d="M8 22 H34 A78 78 0 0 1 34 158 H8"/>
  <rect x="260" y="58" width="52" height="64"/><circle cx="260" cy="90" r="18"/><path d="M312 22 H286 A78 78 0 0 0 286 158 H312"/></g>
  <ellipse cx="160" cy="146" rx="13" ry="3.5" fill="#00000040"/>
  <g class="ball"><circle cx="160" cy="132" r="12" fill="#e8661a" stroke="#2a1205" stroke-width="1.6"/><path d="M148 132h24M160 120v24M151 123c5 6 5 12 0 18M169 123c-5 6-5 12 0 18" stroke="#2a1205" stroke-width="1.4" fill="none"/></g></svg>`;

// vídeo do treino: YouTube ou arquivo .mp4/.webm
export function mediaEmbed(url) {
  if (!url) return court;
  const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0" title="Vídeo do treino" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  return `<video controls playsinline muted loop preload="metadata" src="${esc(url)}"></video>`;
}

export function flash(html, ms) {
  const t = document.createElement('div'); t.innerHTML = html;
  const el = t.firstElementChild; document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

export const skeleton = (n = 3) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');
