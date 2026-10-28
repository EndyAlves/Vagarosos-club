// Medalhas, eventos, ranking e notificações
import { esc, fmtInt, timeAgo, avatarUrl, posIcon } from '../lib/util.js';
import { MEDALS, medalProgress } from '../data/content.js';
import { showError, medalIcon, skeleton, withLoading, toast } from '../ui.js';

// ---------------- medalhas ----------------
let medalFilter = 'Todas';
export function medalsView(ctx) {
  const types = ['Todas', 'Conquistadas', ...new Set(MEDALS.map((m) => m.type))];
  const render = (root) => {
    const all = MEDALS.map((m) => ({ m, ...medalProgress(ctx.me, m) }));
    const list = all.filter(({ m, tier }) => medalFilter === 'Todas' || (medalFilter === 'Conquistadas' ? tier > 0 : m.type === medalFilter));
    const by = (t) => all.filter((x) => x.tier >= t).length;
    root.querySelector('#medals').innerHTML = `
      <div class="medal-summary"><div><b style="color:#cd7f32">${by(1)}</b><span>bronze+</span></div><div><b style="color:#c0c0c0">${by(2)}</b><span>prata+</span></div><div><b style="color:#ffd700">${by(3)}</b><span>ouro</span></div></div>
      <div class="filters" role="group" aria-label="Filtrar medalhas">${types.map((t) => `<button class="chip" data-f="${esc(t)}" aria-pressed="${t === medalFilter}">${esc(t)}</button>`).join('')}</div>
      <div class="stack" style="gap:10px">${list.map(({ m, xp, tier }) => {
        const next = m.tiers[Math.min(tier, 2)], prev = tier ? m.tiers[tier - 1] : 0;
        const pct = tier === 3 ? 100 : Math.min(100, ((xp - prev) / (next - prev)) * 100);
        return `<div class="card medal-card">${medalIcon(tier, m.title)}
          <div style="min-width:0"><h3>${esc(m.title)}</h3><span class="ty">${esc(m.type)}</span><p>${esc(m.desc)}</p>
          <div class="tiers">${['Bronze', 'Prata', 'Ouro'].map((n, i) => `<span class="${['t-b', 't-s', 't-g'][i]}${tier > i ? ' got' : ''}">${n} ${fmtInt(m.tiers[i])}</span>`).join('')}</div>
          <div class="pbar sm"><div style="width:${pct.toFixed(1)}%"></div><span>${tier === 3 ? 'MAX' : fmtInt(xp) + ' / ' + fmtInt(next)}</span></div></div></div>`;
      }).join('') || '<div class="empty"><b>Nenhuma ainda</b>Treine nas Jornadas para conquistar a primeira.</div>'}</div>`;
    root.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { medalFilter = b.dataset.f; render(root); }));
  };
  return {
    title: 'Medalhas', nav: 'medalhas',
    html: `<div class="page-head"><h1 class="tx-vg">Medalhas</h1><span class="muted" style="font-size:12px">${MEDALS.length} no total</span></div><div id="medals"></div>`,
    bind: render,
  };
}

// ---------------- eventos ----------------
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function untilText(d) {
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  return days <= 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`;
}
export function eventsView(ctx) {
  let events = [];
  const paint = (root) => {
    root.querySelector('#evs').innerHTML = events.length ? events.map((e) => {
      const d = new Date(e.starts_at);
      const going = e.attendees.some((a) => a.user_id === ctx.me.id);
      const faces = e.attendees.slice(0, 6);
      return `<div class="card event">
        <div class="date"><b>${String(d.getDate()).padStart(2, '0')}</b>${MESES[d.getMonth()]}<small>${SEMANA[d.getDay()]}</small></div>
        <div style="min-width:0"><h3>${esc(e.title)}</h3>
          <div class="when">${untilText(d)} · ${d.getHours()}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}${e.place ? ' · ' + esc(e.place) : ''}</div>
          ${e.description ? `<p>${esc(e.description)}</p>` : ''}
          <div class="foot"><div class="faces">${faces.map((a) => `<img src="${avatarUrl(a)}" alt="${esc(a.username)}" title="${esc(a.username)}" loading="lazy">`).join('')}
            <span>${e.attendees.length ? `${e.attendees.length} ${e.attendees.length === 1 ? 'vai' : 'vão'}` : 'Ninguém confirmou ainda'}</span></div>
            <button class="btn sm${going ? ' dark' : ''}" data-go="${e.id}" aria-pressed="${going}">${going ? '✓ Vou' : 'Eu vou!'}</button></div>
        </div></div>`;
    }).join('') : '<div class="empty"><b>Nenhum evento marcado</b>Fique de olho: os admins publicam os próximos rachas aqui.</div>';
  };
  return {
    title: 'Eventos', nav: 'eventos',
    html: `<div class="page-head"><h1 class="tx-vg">Eventos</h1>${ctx.me.is_admin ? '<a class="btn sm dark" href="/admin#eventos" data-link>Gerenciar</a>' : ''}</div><div class="stack" id="evs" style="gap:10px">${skeleton(2)}</div>`,
    async bind(root) {
      try { events = await ctx.store.events(); paint(root); } catch (err) { showError(err); }
      root.querySelector('#evs').addEventListener('click', async (e) => {
        const b = e.target.closest('[data-go]'); if (!b) return;
        const ev = events.find((x) => String(x.id) === b.dataset.go);
        const going = ev.attendees.some((a) => a.user_id === ctx.me.id);
        try {
          await withLoading(ctx.store.toggleGoing(ev.id, going));
          ev.attendees = going ? ev.attendees.filter((a) => a.user_id !== ctx.me.id) : [...ev.attendees, { user_id: ctx.me.id, username: ctx.me.username, avatar_url: ctx.me.avatar_url }];
          paint(root); if (!going) toast('Presença confirmada!', 'ok');
        } catch (err) { showError(err); }
      });
    },
  };
}

// ---------------- ranking ----------------
export function rankingView(ctx) {
  return {
    title: 'Ranking', nav: 'ranking',
    html: `<div class="page-head"><h1 class="tx-vg">Ranking</h1></div>
      <div class="rank-head"><span></span><span>Player</span><span class="s">LVL</span><span class="s">Exp</span></div><div id="rk">${skeleton(4)}</div>`,
    async bind(root) {
      try {
        const list = await ctx.store.ranking();
        root.querySelector('#rk').innerHTML = list.map((u, i) => `
          <a class="rank-row${u.id === ctx.me.id ? ' me' : ''}" href="/u/${esc(u.username)}" data-link>
            <span class="n ${i < 3 ? 'p' + (i + 1) : ''}">${i + 1}</span>
            <span class="who"><img class="av" src="${avatarUrl(u)}" alt="" loading="lazy" width="46" height="46">${u.position ? `<img class="pos" src="${posIcon(u.position)}" alt="${u.position}">` : '<span style="width:12px"></span>'}<span>${esc(u.username)}</span></span>
            <span class="l">${u.level}</span><span class="x">${fmtInt(u.experience)}</span>
          </a>`).join('') || '<div class="empty"><b>Ranking vazio</b></div>';
      } catch (err) { showError(err); }
    },
  };
}

// ---------------- notificações ----------------
export function notificationsView(ctx) {
  return {
    title: 'Notificações', back: true,
    html: `<div class="page-head"><h1 class="tx-vg">Notificações</h1></div><div id="nt">${skeleton(3)}</div>`,
    async bind(root) {
      try {
        const list = await ctx.store.notifications();
        root.querySelector('#nt').innerHTML = list.length ? list.map((n) => {
          const who = n.actor ? `<b>${esc(n.actor.username)}</b>` : '';
          const [ico, txt, href] = n.type === 'like' ? ['❤️', `${who} curtiu seu post`, `/post/${n.post_id}`]
            : n.type === 'comment' ? ['💬', `${who} comentou: “${esc(n.data?.text || '')}”`, `/post/${n.post_id}`]
            : ['⭐', `Você subiu para o <b>nível ${esc(n.data?.level)}</b>!`, '/medalhas'];
          return `<a class="notif${n.read ? '' : ' unread'}" href="${href}" data-link>
            ${n.actor ? `<img class="avatar s40" src="${avatarUrl(n.actor)}" alt="">` : `<span class="ico">${ico}</span>`}
            <span class="t">${n.actor ? ico + ' ' : ''}${txt}</span><time>${timeAgo(n.created_at)}</time></a>`;
        }).join('') : '<div class="empty"><b>Tudo tranquilo</b>Curtidas, comentários e subidas de nível aparecem aqui.</div>';
        if (list.some((n) => !n.read)) { await ctx.store.markAllRead(); ctx.refreshBadge(); }
      } catch (err) { showError(err); }
    },
  };
}
