import './styles.css';
import { createStore } from './data/index.js';
import { esc, fmtInt, avatarUrl } from './lib/util.js';
import { levelProgress, earnedMedals } from './data/content.js';
import { toast, showError, xpBar, bellIcon, medalIcon } from './ui.js';
import { loginView, signupView } from './views/auth.js';
import { feedView, postView } from './views/feed.js';
import { categoriesView, categoryView, trainView } from './views/jornadas.js';
import { medalsView, eventsView, rankingView, notificationsView } from './views/club.js';
import { profileView, editProfileView } from './views/perfil.js';
import { adminView } from './views/admin.js';

const app = document.getElementById('app');
const SITE = 'Vagarosos Club';
const NAV = [
  ['painel', '/', 'Painel', '/img/nav-home.webp'],
  ['jornadas', '/jornadas', 'Jornadas', '/img/nav-jorney.webp'],
  ['medalhas', '/medalhas', 'Medalhas', '/img/nav-badges.webp'],
  ['eventos', '/eventos', 'Eventos', '/img/nav-events.webp'],
  ['ranking', '/ranking', 'Ranking', '/img/nav-ranking.webp'],
];

let store;
let me = null;
let cleanups = [];
let feedListeners = [];
let unsubscribe = null;
let renderToken = 0;

// ---------- contexto passado às telas ----------
const ctx = {
  get store() { return store; },
  get me() { return me; },
  setMe(p) { me = p; paintChrome(); },
  patchMe(fields) { me = { ...me, ...fields }; },
  go,
  setTitle(t) { document.title = `${t} · ${SITE}`; const el = document.querySelector('.topbar .title'); if (el) el.textContent = t; },
  cleanup(fn) { cleanups.push(fn); },
  onFeedChange(fn) { feedListeners.push(fn); },
  refreshBadge,
  refreshRail,
  async loggedIn(profile) { me = profile; startRealtime(); go(me.onboarded ? '/' : '/boas-vindas', { replace: true }); },
};

// ---------- rotas ----------
const ROUTES = [
  [/^\/$/, () => feedView(ctx)],
  [/^\/jornadas$/, () => categoriesView(ctx)],
  [/^\/jornadas\/([a-z0-9-]+)$/, (m) => categoryView(ctx, m[1])],
  [/^\/treino\/(\d+)$/, (m) => trainView(ctx, +m[1])],
  [/^\/medalhas$/, () => medalsView(ctx)],
  [/^\/eventos$/, () => eventsView(ctx)],
  [/^\/ranking$/, () => rankingView(ctx)],
  [/^\/notificacoes$/, () => notificationsView(ctx)],
  [/^\/post\/([\w-]+)$/, (m) => postView(ctx, m[1])],
  [/^\/u\/([a-z0-9._]+)$/i, (m) => profileView(ctx, decodeURIComponent(m[1]).toLowerCase())],
  [/^\/perfil$/, () => editProfileView(ctx)],
  [/^\/boas-vindas$/, () => editProfileView(ctx, { onboarding: true })],
  [/^\/admin$/, () => adminView(ctx)],
];

function go(path, { replace = false } = {}) {
  if (path !== location.pathname + location.hash) history[replace ? 'replaceState' : 'pushState']({}, '', path);
  render();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  closePanel();
  go(a.getAttribute('href'));
});
window.addEventListener('popstate', () => render());

// ---------- desenho da página ----------
async function render() {
  const token = ++renderToken;
  cleanups.forEach((fn) => { try { fn(); } catch { /* */ } });
  cleanups = []; feedListeners = [];
  const path = location.pathname.replace(/\/+$/, '') || '/';

  if (!me) {
    document.body.classList.remove('in-app');
    const view = path === '/cadastro' ? signupView(ctx) : loginView(ctx);
    if (path !== '/' && path !== '/cadastro') history.replaceState({}, '', '/');
    app.innerHTML = demoBar() + view.html;
    document.title = path === '/cadastro' ? `Cadastro · ${SITE}` : `${SITE} · Treine, ganhe XP e suba no ranking`;
    view.bind?.(app);
    return;
  }

  if (!me.onboarded && path !== '/boas-vindas') return go('/boas-vindas', { replace: true });
  if (path === '/cadastro') return go('/', { replace: true });

  const match = ROUTES.map(([re, fn]) => [path.match(re), fn]).find(([m]) => m);
  const view = match ? match[1](match[0]) : { title: 'Página não encontrada', back: true, html: '<div class="empty"><b>Página não encontrada</b><a class="linkish" href="/" data-link>Voltar para o Painel</a></div>' };

  if (!document.querySelector('.shell')) paintShell();
  const main = document.getElementById('main');
  main.innerHTML = topbar(view) + `<div id="view">${view.html}</div>`;
  ctx.setTitle(view.title);
  markNav(view.nav);
  window.scrollTo(0, 0);
  bindTopbar(view);
  main.querySelector('.topbar').classList.toggle('has-heading', !!main.querySelector('#view > .page-head h1'));
  if (token === renderToken) await view.bind?.(document.getElementById('view'));
}

function demoBar() {
  return store.mode === 'local' ? '<div class="demo-bar">Modo demonstração: os dados ficam só neste navegador. Configure o Supabase para usar com o clube.</div>' : '';
}

function paintShell() {
  document.body.classList.add('in-app');
  app.innerHTML = demoBar() + `<div class="shell">
    <aside class="sidenav" aria-label="Menu">
      <a class="brand" href="/" data-link><img src="/img/logo.webp" alt="" width="52" height="52"><span class="tx-vg">Vagarosos<br>Club</span></a>
      <nav>${NAV.map(([k, href, label, ic]) => `<a href="${href}" data-link data-nav="${k}"><img src="${ic}" alt="" width="22" height="24">${label}</a>`).join('')}</nav>
      <span id="adminLink"></span>
      <button class="btn-pop-reverse" data-logout>Sair</button>
    </aside>
    <main class="main" id="main"></main>
    <aside class="rail" id="rail" aria-label="Resumo"></aside>
  </div>
  <nav class="tabbar" aria-label="Navegação">${NAV.map(([k, href, label, ic]) => `<a href="${href}" data-link data-nav="${k}"><img src="${ic}" alt="" width="22" height="22">${label}</a>`).join('')}</nav>`;
  app.querySelector('[data-logout]').addEventListener('click', logout);
  paintChrome();
  refreshRail();
}

function paintChrome() {
  const al = document.getElementById('adminLink');
  if (al) al.innerHTML = me?.is_admin ? '<nav style="margin-top:6px"><a href="/admin" data-link data-nav="admin"><span style="width:22px;text-align:center">⚙</span>Admin</a></nav>' : '';
  const btn = document.querySelector('.me-btn img');
  if (btn) btn.src = avatarUrl(me);
}

function markNav(key) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.querySelector('.tabbar').hidden = key === 'none';
}

function topbar(view) {
  const back = view.back
    ? `<button class="back" id="backBtn" aria-label="Voltar"><img src="/img/back.webp" alt="" width="34" height="34"></button>` : '';
  const brand = !view.back ? `<a class="brand-mini" href="/" data-link aria-label="Início"><img src="/img/logo.webp" alt="" width="34" height="34"></a>` : '';
  return `<header class="topbar">${back}${brand}<span class="title tx-vg">${esc(view.title)}</span>
    <a class="icon-btn bell" href="/notificacoes" data-link aria-label="Notificações">${bellIcon}<span class="badge" id="badge" hidden></span></a>
    <button class="me-btn" id="meBtn" aria-label="Meu perfil" aria-expanded="false"><img src="${avatarUrl(me)}" alt=""></button></header>`;
}

function bindTopbar(view) {
  document.getElementById('backBtn')?.addEventListener('click', () => {
    if (typeof view.back === 'string') go(view.back);
    else if (history.length > 1 && document.referrer.startsWith(location.origin)) history.back();
    else if (history.state) history.back(); else go('/');
  });
  document.getElementById('meBtn').addEventListener('click', togglePanel);
  refreshBadge();
}

// ---------- painel do perfil ----------
function togglePanel() {
  if (document.querySelector('.me-panel')) return closePanel();
  const p = levelProgress(me.experience);
  const medals = earnedMedals(me).slice(0, 8);
  const el = document.createElement('div');
  el.innerHTML = `<div class="scrim" data-close></div><div class="me-panel" role="dialog" aria-label="Meu perfil">
    <div class="who"><img class="avatar s48" src="${avatarUrl(me)}" alt="">
      <div style="min-width:0;flex:1"><div class="neue-bold tx-vg" style="font-size:1.25rem;overflow-wrap:anywhere">${esc(me.username)}</div>
      <div class="muted num" style="font-size:12px">Nível ${p.level} · ${fmtInt(me.experience)} XP</div></div></div>
    <div style="margin-top:10px">${xpBar(me.experience)}</div>
    <div class="section-title shadow-medals" style="font-size:1.15rem;margin-top:12px">Last Medals Earned</div>
    <div class="medal-strip" style="margin-top:6px">${medals.map((x) => medalIcon(x.tier, x.m.title)).join('') || '<span class="muted" style="font-size:12px">Nenhuma ainda. Bora treinar!</span>'}</div>
    <nav>
      <a href="/u/${esc(me.username)}" data-link>👤 Meu perfil</a>
      <a href="/perfil" data-link>✏️ Editar perfil</a>
      <a href="/notificacoes" data-link>🔔 Notificações</a>
      ${me.is_admin ? '<a href="/admin" data-link>⚙️ Admin</a>' : ''}
      <button data-logout>🚪 Sair</button>
    </nav></div>`;
  document.body.appendChild(el);
  el.id = 'panelRoot';
  el.querySelector('[data-close]').addEventListener('click', closePanel);
  el.querySelector('[data-logout]').addEventListener('click', logout);
  document.getElementById('meBtn')?.setAttribute('aria-expanded', 'true');
}
function closePanel() {
  document.getElementById('panelRoot')?.remove();
  document.getElementById('meBtn')?.setAttribute('aria-expanded', 'false');
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

// ---------- coluna de resumo (telas grandes) ----------
let railTimer = null;
function refreshRail() {
  clearTimeout(railTimer);
  railTimer = setTimeout(async () => {
    const rail = document.getElementById('rail');
    if (!rail || getComputedStyle(rail).display === 'none' || !me) return;
    const [rank, events] = await Promise.all([store.ranking().catch(() => []), store.events().catch(() => [])]);
    const p = levelProgress(me.experience);
    const pos = rank.findIndex((u) => u.id === me.id);
    const next = events[0];
    rail.innerHTML = `
      <div class="panel"><h3 class="tx-vg">Seu nível</h3>
        <div class="row between" style="margin-bottom:6px"><span class="sprite" style="font-size:2.2rem;line-height:1;color:var(--orange)">${p.level}</span>
        <span class="muted num" style="font-size:12px">${pos >= 0 ? `#${pos + 1} no ranking` : ''}</span></div>${xpBar(me.experience)}</div>
      <div class="panel mini-rank"><h3 class="tx-vg">Top 5</h3>${rank.slice(0, 5).map((u, i) => `<a href="/u/${esc(u.username)}" data-link>
        <b class="num">${i + 1}</b><img src="${avatarUrl(u)}" alt="" loading="lazy"><span>${esc(u.username)}</span><span class="muted num" style="font-size:11px">LVL ${u.level}</span></a>`).join('')}
        <a href="/ranking" data-link class="linkish" style="display:block;margin-top:6px;font-size:13px">Ver ranking completo</a></div>
      ${next ? `<a class="panel" href="/eventos" data-link style="display:block"><h3 class="tx-vg">Próximo evento</h3>
        <div class="neue-bold">${esc(next.title)}</div><div class="muted" style="font-size:12px;margin-top:2px">${new Date(next.starts_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}${next.place ? ' · ' + esc(next.place) : ''}</div>
        <div class="muted" style="font-size:12px;margin-top:6px">${next.attendees.length} confirmados</div></a>` : ''}`;
  }, 150);
}

// ---------- notificações e tempo real ----------
async function refreshBadge() {
  if (!me) return;
  try {
    const n = await store.unreadCount();
    const b = document.getElementById('badge');
    if (b) { b.hidden = !n; b.textContent = n > 9 ? '9+' : n; }
  } catch { /* sem conexão: tenta de novo depois */ }
}
function startRealtime() {
  unsubscribe?.();
  unsubscribe = store.subscribe((kind) => {
    if (kind === 'feed') feedListeners.forEach((fn) => fn());
    if (kind === 'notif') { refreshBadge(); toast('Nova notificação'); }
  });
}
setInterval(() => { if (me && document.visibilityState === 'visible') refreshBadge(); }, 60000);

async function logout() {
  closePanel();
  unsubscribe?.(); unsubscribe = null;
  await store.signOut();
  me = null;
  history.replaceState({}, '', '/');
  render();
}

// ---------- início ----------
(async function boot() {
  try {
    store = await createStore();
    me = await store.currentUser();
    store.onAuthChange((u) => { if (!u && me) { me = null; render(); } });
    if (me) startRealtime();
  } catch (err) {
    showError(err);
  }
  if (!store) { app.innerHTML = '<div class="empty"><b>Não foi possível iniciar</b>Recarregue a página.</div>'; return; }
  render();
})();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
