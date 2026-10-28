// Jornadas: categorias, lista de treinos e a tela de treino com XP
import { esc, fmtInt } from '../lib/util.js';
import { DIFFICULTY, levelProgress } from '../data/content.js';
import { showError, xpBar, mediaEmbed, flash, skeleton } from '../ui.js';

export function categoriesView(ctx) {
  return {
    title: 'Jornadas', nav: 'jornadas',
    html: `<div class="page-head"><h1 class="tx-vg">Jornadas</h1><span class="muted num" style="font-size:12px">${fmtInt(ctx.me.experience)} XP total</span></div>
      <div class="stack" id="cats">${skeleton(3)}</div>`,
    async bind(root) {
      try {
        const cats = await ctx.store.categories();
        const xp = ctx.me.xp_by_category || {};
        root.querySelector('#cats').innerHTML = cats.length ? cats.map((c) => `
          <a class="card cat-card" href="/jornadas/${esc(c.slug)}" data-link>
            <img src="/img/ball.webp" alt="" width="64" height="64">
            <div style="flex:1;min-width:0"><div class="t">${esc(c.title)}</div><p class="d">${esc(c.description || '')}</p>
              <div class="meta"><span class="num">${c.count} ${c.count === 1 ? 'treino' : 'treinos'} · ${fmtInt(xp[c.slug] || 0)} XP</span><span class="btn sm">COMEÇAR</span></div></div>
          </a>`).join('') : '<div class="empty"><b>Nenhuma jornada</b>Um admin precisa cadastrar os treinos.</div>';
      } catch (err) { showError(err); }
    },
  };
}

export function categoryView(ctx, slug) {
  return {
    title: 'Jornadas', nav: 'jornadas', back: '/jornadas',
    html: `<div class="page-head"><h1 class="tx-vg" id="ctitle">&nbsp;</h1></div><div class="stack" id="list" style="gap:10px">${skeleton(4)}</div>`,
    async bind(root) {
      try {
        const [cats, list] = await Promise.all([ctx.store.categories(), ctx.store.jorneys(slug)]);
        const c = cats.find((x) => x.slug === slug);
        root.querySelector('#ctitle').textContent = c ? c.title : 'Jornada';
        if (c) ctx.setTitle(c.title);
        root.querySelector('#list').innerHTML = list.length ? list.map((j, i) => `
          <a class="card jor-row" href="/treino/${j.id}" data-link>
            <span class="id num">${i + 1}</span>
            <span style="min-width:0"><span class="t">${esc(j.title)}</span><br><span class="x">${j.xpps} XP/s${j.media_url ? ' · com vídeo' : ''}</span></span>
            <span class="badge-dif ${j.difficulty}">${DIFFICULTY[j.difficulty]}</span>
          </a>`).join('') : '<div class="empty"><b>Mais treinos em breve...</b></div>';
      } catch (err) { showError(err); }
    },
  };
}

export function trainView(ctx, id) {
  let timer = null;
  let sessionXp = 0;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  ctx.cleanup(stop);

  return {
    title: 'Treino', nav: 'jornadas', back: true,
    html: `<div id="tr">${skeleton(2)}</div>`,
    async bind(root) {
      let j;
      try { j = await ctx.store.jorney(id); } catch (err) { showError(err); }
      if (!j) { root.querySelector('#tr').innerHTML = '<div class="empty"><b>Treino não encontrado</b></div>'; return; }
      ctx.setTitle(j.title);
      const cats = await ctx.store.categories().catch(() => []);
      const cat = cats.find((c) => c.slug === j.category);

      const lvl = () => levelProgress(ctx.me.experience);
      root.querySelector('#tr').innerHTML = `<section class="treino" id="sec">
        <div class="molde-midia">${mediaEmbed(j.media_url)}</div>
        <h2 class="shadow-effect">${esc(j.title)}</h2>
        <div class="type shadow-effect">${esc(cat?.title || j.category)} · <span class="badge-dif ${j.difficulty}" style="font-family:var(--f-ui);vertical-align:3px">${DIFFICULTY[j.difficulty]}</span></div>
        <div class="lvl"><span id="lv1">LVL ${lvl().level}</span><span id="lv2">LVL ${lvl().level + 1}</span></div>
        <div id="pb">${xpBar(ctx.me.experience)}</div>
        <div class="xpps shadow-effect"><span>xp per second: ${j.xpps}</span><span id="catxp" class="num">${fmtInt((ctx.me.xp_by_category || {})[j.category] || 0)} xp ${esc(cat?.title || '')}</span></div>
        ${j.description ? `<p class="desc">${esc(j.description)}</p>` : ''}
        ${j.tip ? `<p class="tip">Dica: ${esc(j.tip)}</p>` : ''}
        <div class="play-wrap"><button id="play" class="btn-play neonOf" aria-pressed="false">PLAY</button></div>
        <p class="session-xp" id="sess">Aperte PLAY quando começar o treino e STOP quando terminar.</p>
      </section>`;

      const btn = root.querySelector('#play'), sec = root.querySelector('#sec'), sess = root.querySelector('#sess');
      const tick = async () => {
        try {
          const r = await ctx.store.trainTick(j.id);
          sessionXp += r.gain;
          ctx.patchMe({ experience: r.experience, level: r.level, xp_by_category: r.xp_by_category });
          const p = lvl();
          root.querySelector('#pb').innerHTML = xpBar(r.experience);
          root.querySelector('#lv1').textContent = `LVL ${p.level}`; root.querySelector('#lv2').textContent = `LVL ${p.level + 1}`;
          root.querySelector('#catxp').textContent = `${fmtInt(r.xp_by_category[j.category] || 0)} xp ${cat?.title || ''}`;
          sess.textContent = `Nesta sessão: +${fmtInt(sessionXp)} XP`;
          flash(`<div class="xp-float">+${r.gain} XP</div>`, 1200);
          if (r.leveled_up) { flash(`<div class="lvlup"><span>LEVEL ${r.level}!</span></div>`, 1900); ctx.refreshBadge(); }
        } catch (err) {
          if (/too_fast/.test(err.message)) return;
          stopUi(); showError(err);
        }
      };
      const stopUi = () => { stop(); btn.textContent = 'PLAY'; btn.className = 'btn-play neonOf'; btn.setAttribute('aria-pressed', 'false'); sec.classList.remove('playing'); ctx.refreshRail(); };
      btn.addEventListener('click', () => {
        if (timer) return stopUi();
        btn.textContent = 'STOP'; btn.className = 'btn-play neonOn'; btn.setAttribute('aria-pressed', 'true'); sec.classList.add('playing');
        timer = setInterval(tick, 2000);
      });
    },
  };
}
