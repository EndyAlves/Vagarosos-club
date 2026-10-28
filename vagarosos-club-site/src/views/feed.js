// Painel (feed de posts), post único e o componente de post
import { esc, timeAgo, fullDate, avatarUrl, posIcon, compressImage } from '../lib/util.js';
import { withLoading, showError, toast, confirmDialog, heart, skeleton } from '../ui.js';

export function postHTML(p, ctx, open) {
  const me = ctx.me;
  const liked = p.likes.some((l) => l.user_id === me.id);
  const canDelete = p.author.id === me.id || me.is_admin;
  return `<article class="card post" data-post="${p.id}">
    <div class="post-head">
      <a href="/u/${esc(p.author.username)}" data-link><img class="avatar s40" src="${avatarUrl(p.author)}" alt="" width="40" height="40" loading="lazy"></a>
      <div class="who"><a href="/u/${esc(p.author.username)}" data-link>${esc(p.author.username)}</a>${p.author.position ? `<img class="pos" src="${posIcon(p.author.position)}" alt="${p.author.position}">` : ''}
        <div class="when" title="${fullDate(p.created_at)}">${timeAgo(p.created_at)}</div></div>
      ${canDelete ? `<button class="icon-btn" data-act="del-post" aria-label="Apagar post" title="Apagar post">🗑</button>` : ''}
    </div>
    <div class="post-body">
      ${p.text ? `<p>${esc(p.text)}</p>` : ''}
      ${p.image_url ? `<img src="${esc(p.image_url)}" alt="Imagem do post de ${esc(p.author.username)}" loading="lazy">` : ''}
    </div>
    <div class="post-actions">
      <button data-act="like" class="${liked ? 'liked' : ''}" aria-pressed="${liked}">${heart(liked)}<span class="num">${p.likes.length} ${p.likes.length === 1 ? 'Like' : 'Likes'}</span></button>
      <button data-act="toggle-comments" aria-expanded="${!!open}"><img src="/img/chat.webp" alt="" width="20" height="20"><span class="num">${p.comments.length} ${p.comments.length === 1 ? 'Comentário' : 'Comentários'}</span></button>
    </div>
    ${open ? `<div class="comments">
      ${p.comments.map((c) => `<div class="comment"><div class="txt"><a href="/u/${esc(c.author.username)}" data-link>${esc(c.author.username)}</a> ${esc(c.text)}
        <span class="faint" style="font-size:11px"> · ${timeAgo(c.created_at)}</span></div>
        ${c.author.id === me.id || p.author.id === me.id || me.is_admin ? `<button class="del" data-act="del-comment" data-id="${c.id}" aria-label="Apagar comentário">✕</button>` : ''}</div>`).join('') || '<p class="faint" style="font-size:13px">Seja o primeiro a comentar.</p>'}
      <form class="comment-form" data-act="comment"><label class="sr-only" for="c-${p.id}">Comentário</label>
        <input id="c-${p.id}" placeholder="Digite um comentário" maxlength="300" autocomplete="off"><button class="btn blue sm" type="submit">Comentar</button></form>
    </div>` : ''}
  </article>`;
}

// Liga as ações de uma lista de posts. getPost/setPost mantêm o estado local.
export function bindPosts(container, ctx, { getPost, setPost, removePost, openSet }) {
  const rerender = (id) => {
    const el = container.querySelector(`[data-post="${id}"]`);
    if (!el) return;
    const typed = el.querySelector('.comment-form input')?.value;
    el.outerHTML = postHTML(getPost(id), ctx, openSet.has(id));
    const input = container.querySelector(`[data-post="${id}"] .comment-form input`);
    if (input && typed) input.value = typed;
  };
  const reload = async (id) => { setPost(await ctx.store.post(id)); rerender(id); };

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.tagName === 'FORM') return;
    const id = btn.closest('[data-post]')?.dataset.post;
    if (!id) return;
    const p = getPost(id);
    const act = btn.dataset.act;
    try {
      if (act === 'like') {
        const liked = p.likes.some((l) => l.user_id === ctx.me.id);
        p.likes = liked ? p.likes.filter((l) => l.user_id !== ctx.me.id) : [...p.likes, { user_id: ctx.me.id }];
        rerender(id);                                 // resposta imediata
        await ctx.store.toggleLike(id, liked);
      } else if (act === 'toggle-comments') {
        openSet.has(id) ? openSet.delete(id) : openSet.add(id);
        rerender(id);
        if (openSet.has(id)) container.querySelector(`#c-${id}`)?.focus();
      } else if (act === 'del-post') {
        if (!(await confirmDialog('Apagar este post? Isso não pode ser desfeito.', 'Apagar'))) return;
        await withLoading(ctx.store.deletePost(p));
        removePost(id); container.querySelector(`[data-post="${id}"]`)?.remove();
        toast('Post apagado.', 'ok');
      } else if (act === 'del-comment') {
        if (!(await confirmDialog('Apagar este comentário?', 'Apagar'))) return;
        await withLoading(ctx.store.deleteComment(btn.dataset.id));
        await reload(id);
      }
    } catch (err) { showError(err); reload(id).catch(() => {}); }
  });

  container.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-act="comment"]');
    if (!form) return;
    e.preventDefault();
    const id = form.closest('[data-post]').dataset.post;
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) return toast('Escreva um comentário.', 'err');
    form.querySelector('button').disabled = true;
    try { await withLoading(ctx.store.addComment(id, text)); input.value = ''; await reload(id); container.querySelector(`#c-${id}`)?.focus(); }
    catch (err) { showError(err); form.querySelector('button').disabled = false; }
  });
}

export function feedView(ctx) {
  let posts = [];
  let done = false;
  const openSet = new Set();
  let image = null;

  return {
    title: 'Painel', nav: 'painel',
    html: `<form class="card composer" id="composer" novalidate>
        <div class="top"><img class="avatar s48" src="${avatarUrl(ctx.me)}" alt="" width="48" height="48">
          <label class="sr-only" for="ptext">Escreva algo</label>
          <textarea id="ptext" rows="1" maxlength="500" placeholder="Escreva algo..."></textarea></div>
        <div class="preview" id="preview" hidden><img alt="Prévia da imagem"><button type="button" id="rmImg" aria-label="Remover imagem">×</button></div>
        <div class="bottom">
          <label for="pfile" class="inputFile" title="Adicionar imagem"><span class="sr-only">Adicionar imagem</span></label>
          <input id="pfile" class="file-input" type="file" accept="image/*">
          <span class="count" id="pcount">0/500</span>
          <button type="submit" class="btn blue">Publicar</button>
        </div>
      </form>
      <div id="newPill"></div>
      <div class="stack" id="posts" style="margin-top:18px">${skeleton(3)}</div>
      <div style="text-align:center;margin:20px 0" id="moreBox"></div>`,

    async bind(root) {
      const list = root.querySelector('#posts');
      const f = root.querySelector('#composer');
      const ta = f.ptext, count = root.querySelector('#pcount'), prev = root.querySelector('#preview');

      const paint = () => {
        list.innerHTML = posts.length ? posts.map((p) => postHTML(p, ctx, openSet.has(p.id))).join('')
          : '<div class="empty"><b>Nada por aqui ainda</b>Publique o primeiro post do clube!</div>';
        root.querySelector('#moreBox').innerHTML = !done && posts.length ? '<button class="btn dark" id="more">Carregar mais</button>' : '';
        root.querySelector('#more')?.addEventListener('click', loadMore);
      };
      const load = async () => {
        posts = await ctx.store.feed(); done = posts.length < 15; paint();
        root.querySelector('#newPill').innerHTML = '';
      };
      async function loadMore() {
        try {
          const more = await withLoading(ctx.store.feed({ before: posts[posts.length - 1].created_at }));
          posts = posts.concat(more); done = more.length < 15; paint();
        } catch (err) { showError(err); }
      }

      bindPosts(list, ctx, {
        getPost: (id) => posts.find((p) => p.id === id),
        setPost: (np) => { posts = posts.map((p) => (p.id === np.id ? np : p)); },
        removePost: (id) => { posts = posts.filter((p) => p.id !== id); },
        openSet,
      });

      const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'; count.textContent = `${ta.value.length}/500`; };
      ta.addEventListener('input', grow);
      root.querySelector('#pfile').addEventListener('change', async (e) => {
        const file = e.target.files[0]; e.target.value = '';
        if (!file) return;
        try {
          image = await withLoading(compressImage(file, 1280));
          prev.querySelector('img').src = URL.createObjectURL(image); prev.hidden = false;
        } catch (err) { showError(err); }
      });
      root.querySelector('#rmImg').addEventListener('click', () => { image = null; prev.hidden = true; });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = ta.value.trim();
        if (!text && !image) return toast('Escreva algo ou escolha uma imagem.', 'err');
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        try {
          await withLoading(ctx.store.createPost(text, image));
          ta.value = ''; grow(); image = null; prev.hidden = true;
          await load();
          toast('Publicado!', 'ok');
        } catch (err) { showError(err); }
        btn.disabled = false;
      });

      // tempo real: avisa que há novidades em vez de mexer no que a pessoa está lendo
      ctx.onFeedChange(() => {
        const pill = root.querySelector('#newPill');
        if (pill && !pill.innerHTML) {
          pill.innerHTML = '<button class="pill-new" type="button">Novidades no feed · atualizar</button>';
          pill.querySelector('button').addEventListener('click', () => { load(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        }
      });

      try { await load(); } catch (err) { showError(err); list.innerHTML = '<div class="empty"><b>Não deu para carregar</b>Verifique sua conexão e tente de novo.</div>'; }
    },
  };
}

export function postView(ctx, id) {
  let post;
  const openSet = new Set([id]);
  return {
    title: 'Post', back: true,
    html: '<div id="one" class="stack">' + skeleton(1) + '</div>',
    async bind(root) {
      const box = root.querySelector('#one');
      try { post = await ctx.store.post(id); }
      catch { box.innerHTML = '<div class="empty"><b>Post não encontrado</b>Ele pode ter sido apagado.</div>'; return; }
      box.innerHTML = postHTML(post, ctx, true);
      bindPosts(box, ctx, { getPost: () => post, setPost: (p) => { post = p; }, removePost: () => ctx.go('/'), openSet });
    },
  };
}
