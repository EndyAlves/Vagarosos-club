// Perfil público, edição de perfil e boas-vindas (completar cadastro)
import { esc, fmtInt, avatarUrl, posIcon, compressImage, brToIso, isoToBr } from '../lib/util.js';
import { POS, earnedMedals, MEDALS } from '../data/content.js';
import { showError, toast, withLoading, xpBar, medalIcon, skeleton } from '../ui.js';
import { postHTML, bindPosts } from './feed.js';

function age(birth) {
  if (!birth) return null;
  const b = new Date(birth + 'T12:00:00'), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}

export function profileView(ctx, username) {
  let posts = [];
  const openSet = new Set();
  return {
    title: '@' + username, back: true,
    html: `<div id="pf" class="stack">${skeleton(2)}</div>`,
    async bind(root) {
      const box = root.querySelector('#pf');
      let u;
      try { u = username === ctx.me.username ? ctx.me : await ctx.store.profileByUsername(username); } catch (err) { showError(err); }
      if (!u) { box.innerHTML = '<div class="empty"><b>Jogador não encontrado</b>Confira o username.</div>'; return; }
      const isMe = u.id === ctx.me.id;
      const [stats, list] = await Promise.all([ctx.store.stats(u.id).catch(() => ({})), ctx.store.feed({ authorId: u.id }).catch(() => [])]);
      posts = list;
      const medals = earnedMedals(u);
      const a = age(u.birth);
      box.innerHTML = `
        <div class="panel profile-hero">
          <div class="pic"><img src="${avatarUrl(u)}" alt="Foto de ${esc(u.username)}" width="132" height="132"><span class="level-badge" title="Nível">${u.level}</span></div>
          <div style="min-width:0">
            <div class="row" style="gap:8px">${u.position ? `<img src="${posIcon(u.position)}" alt="${u.position}" width="22" height="22">` : ''}
              <h1 class="uname tx-vg glitch" data-glitch="${esc(u.username)}">${esc(u.username)}</h1></div>
            <p class="sub">${[u.full_name, u.position && POS[u.position]?.name, u.height && u.height + ' m', a && a + ' anos'].filter(Boolean).map(esc).join(' · ')}</p>
            ${u.bio ? `<p class="bio">${esc(u.bio)}</p>` : ''}
            <div style="margin-top:10px">${xpBar(u.experience)}</div>
            ${isMe ? '<div class="row" style="margin-top:12px"><a class="btn sm" href="/perfil" data-link>Editar perfil</a></div>' : ''}
          </div>
        </div>
        <div class="stat-tiles tx-vg">
          <div><b>${fmtInt(stats.posts)}</b><span>POSTS</span></div>
          <div><b>${fmtInt(stats.likes)}</b><span>LIKES</span></div>
          <div><b>${fmtInt(stats.events)}</b><span>EVENTOS</span></div>
          <div><b>${medals.length}/${MEDALS.length}</b><span>MEDALHAS</span></div>
        </div>
        <h2 class="section-title shadow-medals">Last Medals Earned</h2>
        <div class="medal-strip">${medals.slice(0, 12).map((x) => medalIcon(x.tier, x.m.title)).join('') || '<span class="muted" style="font-size:13px">Nenhuma medalha ainda.</span>'}</div>
        <h2 class="section-title">Posts</h2>
        <div class="stack" id="uposts">${posts.map((p) => postHTML(p, ctx, false)).join('') || '<p class="muted" style="font-size:13px">Nenhum post ainda.</p>'}</div>`;
      ctx.setTitle('@' + u.username);
      bindPosts(box.querySelector('#uposts'), ctx, {
        getPost: (id) => posts.find((p) => p.id === id),
        setPost: (np) => { posts = posts.map((p) => (p.id === np.id ? np : p)); },
        removePost: (id) => { posts = posts.filter((p) => p.id !== id); },
        openSet,
      });
    },
  };
}

export function editProfileView(ctx, { onboarding = false } = {}) {
  const me = ctx.me;
  let pos = me.position || 'PG';
  let avatar = null;
  return {
    title: onboarding ? 'Bem-vindo' : 'Editar perfil', back: !onboarding, nav: onboarding ? 'none' : undefined,
    html: `<div class="page-head"><h1 class="tx-vg">${onboarding ? 'Bem-vindo!' : 'Editar perfil'}</h1></div>
      ${onboarding ? '<p class="neue muted" style="margin:-6px 0 16px">Para começar, complete seu cadastro de jogador.</p>' : ''}
      <form class="panel form" id="pform" style="padding:16px" novalidate>
        <div class="avatar-pick"><img id="avPrev" src="${avatarUrl(me)}" alt="Sua foto">
          <div><label class="btn sm blue" for="avFile">Escolher foto</label><input id="avFile" class="file-input" type="file" accept="image/*">
          <p class="faint" style="font-size:12px;margin-top:6px">JPG, PNG ou WebP. A gente reduz o tamanho para você.</p></div></div>
        <div class="field"><label for="fname">Nome completo</label><input class="input" id="fname" maxlength="60" value="${esc(me.full_name || '')}" autocomplete="name"></div>
        <div class="grid-2">
          <div class="field"><label for="fheight">Altura</label><input class="input" id="fheight" maxlength="6" placeholder="Exemplo: 1,80" inputmode="decimal" value="${esc(me.height || '')}"></div>
          <div class="field"><label for="fbirth">Data de nascimento</label><input class="input" id="fbirth" placeholder="dd/mm/aaaa" inputmode="numeric" maxlength="10" value="${esc(isoToBr(me.birth))}"></div>
        </div>
        <div class="field"><label for="fbio">Bio <span class="faint">(opcional)</span></label><input class="input" id="fbio" maxlength="160" placeholder="Ex.: Arremessador de 3, joga às terças" value="${esc(me.bio || '')}"></div>
        <div class="field"><span class="lbl">Escolha sua posição</span>
          <div class="pos-tabs" role="group" aria-label="Posição">${Object.keys(POS).map((k) => `<button type="button" class="${k.toLowerCase()}" data-pos="${k}" aria-pressed="${pos === k}" title="${POS[k].name}">${k}</button>`).join('')}</div>
          <div class="slides" id="slides">${Object.entries(POS).map(([k, p]) => `<div class="slide" id="slide-${k}"><div><p class="t">${p.name}</p><p>${p.desc}</p></div><img src="${p.img}" alt="${p.name}" loading="lazy" height="190"></div>`).join('')}</div>
        </div>
        <button class="btn-grad" type="submit">${onboarding ? 'COMEÇAR' : 'SALVAR'}</button>
      </form>`,
    bind(root) {
      const f = root.querySelector('#pform'), slides = root.querySelector('#slides');
      const mark = () => f.querySelectorAll('[data-pos]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pos === pos));
      const show = (smooth) => { const s = root.querySelector('#slide-' + pos); slides.scrollTo({ left: s.offsetLeft - slides.offsetLeft, behavior: smooth ? 'smooth' : 'auto' }); };
      requestAnimationFrame(() => show(false));
      f.querySelectorAll('[data-pos]').forEach((b) => b.addEventListener('click', () => { pos = b.dataset.pos; mark(); show(true); }));
      slides.addEventListener('scroll', () => {
        clearTimeout(slides._t);
        slides._t = setTimeout(() => { const i = Math.round(slides.scrollLeft / (slides.clientWidth + 16)); const k = Object.keys(POS)[i]; if (k && k !== pos) { pos = k; mark(); } }, 120);
      });
      f.fbirth.addEventListener('input', () => {
        const d = f.fbirth.value.replace(/\D/g, '').slice(0, 8);
        f.fbirth.value = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      });
      root.querySelector('#avFile').addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try { avatar = await withLoading(compressImage(file, 400, 0.85)); root.querySelector('#avPrev').src = URL.createObjectURL(avatar); }
        catch (err) { showError(err); }
      });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const full_name = f.fname.value.trim(), height = f.fheight.value.trim(), birthBr = f.fbirth.value.trim();
        if (!full_name) return toast('Informe seu nome.', 'err');
        const birth = birthBr ? brToIso(birthBr) : null;
        if (birthBr && !birth) return toast('Use a data no formato dd/mm/aaaa.', 'err');
        if (height && !/^\d[,.]\d{2}$/.test(height)) return toast('Use a altura no formato 1,80.', 'err');
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        try {
          const updated = await withLoading(ctx.store.updateProfile({ full_name, height: height.replace('.', ','), birth, bio: f.fbio.value.trim(), position: pos, onboarded: true }, avatar));
          ctx.setMe(updated);
          toast(onboarding ? 'Tudo pronto. Bora treinar!' : 'Perfil salvo.', 'ok');
          ctx.go(onboarding ? '/' : '/u/' + updated.username);
        } catch (err) { showError(err); btn.disabled = false; }
      });
    },
  };
}
