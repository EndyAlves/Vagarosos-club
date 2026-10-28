// Área do admin: treinos, categorias, eventos e chave de membro
import { esc } from '../lib/util.js';
import { DIFFICULTY } from '../data/content.js';
import { showError, toast, withLoading, confirmDialog, skeleton } from '../ui.js';

const TABS = [['treinos', 'Treinos'], ['categorias', 'Categorias'], ['eventos', 'Eventos'], ['chave', 'Chave de membro']];
const toLocalInput = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function adminView(ctx) {
  if (!ctx.me.is_admin) {
    return { title: 'Admin', back: true, html: '<div class="empty"><b>Área restrita</b>Só admins do clube acessam esta página.</div>' };
  }
  let tab = TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : 'treinos';
  let cats = [], jors = [], evs = [];
  let editing = null;

  const tabsHtml = () => TABS.map(([k, l]) => `<button class="chip" data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).join('');

  function jorneyForm(j = {}) {
    return `<form class="panel admin-form form" id="af" novalidate><h3>${j.id ? 'Editar treino' : 'Novo treino'}</h3>
      <div class="grid-2"><div class="field"><label for="jcat">Categoria</label><select class="select" id="jcat">${cats.map((c) => `<option value="${esc(c.slug)}"${c.slug === j.category ? ' selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="jdif">Dificuldade</label><select class="select" id="jdif">${Object.entries(DIFFICULTY).map(([k, v]) => `<option value="${k}"${k === j.difficulty ? ' selected' : ''}>${v}</option>`).join('')}</select></div></div>
      <div class="grid-2"><div class="field"><label for="jtit">Título</label><input class="input" id="jtit" maxlength="60" value="${esc(j.title || '')}"></div>
      <div class="field"><label for="jxp">XP por segundo (1 a 20)</label><input class="input" id="jxp" type="number" min="1" max="20" value="${j.xpps || 5}"></div></div>
      <div class="field"><label for="jdesc">Descrição</label><textarea class="textarea" id="jdesc" maxlength="1000">${esc(j.description || '')}</textarea></div>
      <div class="field"><label for="jtip">Dica</label><input class="input" id="jtip" maxlength="300" value="${esc(j.tip || '')}"></div>
      <div class="field"><label for="jmed">Vídeo (opcional)</label><input class="input" id="jmed" placeholder="https://youtube.com/... ou link .mp4" value="${esc(j.media_url || '')}"><span class="hint">Aceita link do YouTube ou de um arquivo .mp4.</span></div>
      <div class="field"><label for="jsort">Ordem</label><input class="input" id="jsort" type="number" value="${j.sort ?? 0}" style="max-width:120px"></div>
      <div class="row"><button class="btn" type="submit">Salvar treino</button><button class="btn dark" type="button" data-cancel>Cancelar</button></div></form>`;
  }
  function categoryForm(c = {}) {
    const isNew = !c.slug;
    return `<form class="panel admin-form form" id="af" novalidate><h3>${isNew ? 'Nova categoria' : 'Editar categoria'}</h3>
      <div class="grid-2"><div class="field"><label for="ctit">Nome</label><input class="input" id="ctit" maxlength="40" value="${esc(c.title || '')}"></div>
      <div class="field"><label for="cslug">Código na URL</label><input class="input" id="cslug" maxlength="30" placeholder="ex.: rebote" value="${esc(c.slug || '')}"${isNew ? '' : ' disabled'}><span class="hint">Letras minúsculas, números e hífen.</span></div></div>
      <div class="field"><label for="cdesc">Descrição</label><textarea class="textarea" id="cdesc" maxlength="300">${esc(c.description || '')}</textarea></div>
      <div class="field"><label for="csort">Ordem</label><input class="input" id="csort" type="number" value="${c.sort ?? cats.length + 1}" style="max-width:120px"></div>
      <div class="row"><button class="btn" type="submit">Salvar categoria</button><button class="btn dark" type="button" data-cancel>Cancelar</button></div></form>`;
  }
  function eventForm(e = {}) {
    const def = new Date(Date.now() + 7 * 864e5); def.setHours(9, 0, 0, 0);
    return `<form class="panel admin-form form" id="af" novalidate><h3>${e.id ? 'Editar evento' : 'Novo evento'}</h3>
      <div class="field"><label for="etit">Título</label><input class="input" id="etit" maxlength="80" value="${esc(e.title || '')}"></div>
      <div class="grid-2"><div class="field"><label for="ewhen">Data e hora</label><input class="input" id="ewhen" type="datetime-local" value="${toLocalInput(e.starts_at || def.toISOString())}"></div>
      <div class="field"><label for="eplace">Local</label><input class="input" id="eplace" maxlength="120" value="${esc(e.place || '')}"></div></div>
      <div class="field"><label for="edesc">Descrição</label><textarea class="textarea" id="edesc" maxlength="600">${esc(e.description || '')}</textarea></div>
      <div class="row"><button class="btn" type="submit">Salvar evento</button><button class="btn dark" type="button" data-cancel>Cancelar</button></div></form>`;
  }

  async function paint(root) {
    const body = root.querySelector('#abody');
    root.querySelector('#atabs').innerHTML = tabsHtml();
    body.innerHTML = skeleton(2);
    try {
      if (tab === 'treinos') {
        [cats, jors] = await Promise.all([ctx.store.categories(), ctx.store.jorneys()]);
        body.innerHTML = (editing ? jorneyForm(editing === 'new' ? {} : editing) : `<button class="btn" data-new>+ Novo treino</button>`) +
          cats.map((c) => `<h2 class="section-title" style="margin-top:18px">${esc(c.title)}</h2><div class="stack admin-list" style="gap:8px">${jors.filter((j) => j.category === c.slug).map((j) => `
            <div class="card item"><div style="min-width:0"><div class="t">${esc(j.title)}</div><div class="s">${DIFFICULTY[j.difficulty]} · ${j.xpps} XP/s${j.media_url ? ' · vídeo' : ''}</div></div>
            <div class="row"><button class="btn sm dark" data-edit="${j.id}">Editar</button><button class="btn sm danger" data-del="${j.id}" aria-label="Apagar ${esc(j.title)}">Apagar</button></div></div>`).join('') || '<p class="muted" style="font-size:13px">Sem treinos.</p>'}</div>`).join('');
      } else if (tab === 'categorias') {
        cats = await ctx.store.categories();
        body.innerHTML = (editing ? categoryForm(editing === 'new' ? {} : editing) : `<button class="btn" data-new>+ Nova categoria</button>`) +
          `<div class="stack admin-list" style="gap:8px;margin-top:14px">${cats.map((c) => `<div class="card item"><div style="min-width:0"><div class="t">${esc(c.title)}</div><div class="s">/${esc(c.slug)} · ${c.count} treinos</div></div>
            <div class="row"><button class="btn sm dark" data-edit="${esc(c.slug)}">Editar</button><button class="btn sm danger" data-del="${esc(c.slug)}">Apagar</button></div></div>`).join('')}</div>`;
      } else if (tab === 'eventos') {
        evs = await ctx.store.events();
        body.innerHTML = (editing ? eventForm(editing === 'new' ? {} : editing) : `<button class="btn" data-new>+ Novo evento</button>`) +
          `<div class="stack admin-list" style="gap:8px;margin-top:14px">${evs.map((e) => `<div class="card item"><div style="min-width:0"><div class="t">${esc(e.title)}</div><div class="s">${new Date(e.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · ${e.attendees.length} confirmados</div></div>
            <div class="row"><button class="btn sm dark" data-edit="${e.id}">Editar</button><button class="btn sm danger" data-del="${e.id}">Apagar</button></div></div>`).join('') || '<p class="muted">Nenhum evento futuro.</p>'}</div>`;
      } else {
        const key = await ctx.store.getInviteKey();
        body.innerHTML = `<form class="panel admin-form form" id="kf" novalidate><h3>Chave de membro</h3>
          <p class="neue muted" style="font-size:14px">Quem quiser se cadastrar precisa desta chave. Troque sempre que ela vazar.</p>
          <div class="key-box" id="kbox">${esc(key)}</div>
          <div class="row wrap"><button class="btn sm dark" type="button" id="copyKey">Copiar</button></div>
          <div class="field"><label for="nkey">Nova chave</label><input class="input" id="nkey" minlength="6" maxlength="60" placeholder="Mínimo 6 caracteres" autocomplete="off"></div>
          <div class="row"><button class="btn" type="submit">Trocar chave</button><button class="btn dark" type="button" id="genKey">Gerar aleatória</button></div></form>`;
      }
    } catch (err) { showError(err); body.innerHTML = '<div class="empty"><b>Não foi possível carregar</b></div>'; }
    body.querySelector('#af input, #af select')?.focus();
  }

  return {
    title: 'Admin', back: true,
    html: `<div class="page-head"><h1 class="tx-vg">Admin</h1></div><div class="tabs" id="atabs" role="group" aria-label="Seções"></div><div id="abody"></div>`,
    async bind(root) {
      await paint(root);
      root.querySelector('#atabs').addEventListener('click', (e) => {
        const b = e.target.closest('[data-tab]'); if (!b) return;
        tab = b.dataset.tab; editing = null; history.replaceState(history.state, '', '/admin#' + tab); paint(root);
      });
      const body = root.querySelector('#abody');
      body.addEventListener('click', async (e) => {
        const t = e.target;
        if (t.closest('[data-new]')) { editing = 'new'; return paint(root); }
        if (t.closest('[data-cancel]')) { editing = null; return paint(root); }
        const ed = t.closest('[data-edit]')?.dataset.edit;
        if (ed) {
          editing = tab === 'treinos' ? jors.find((j) => String(j.id) === ed) : tab === 'categorias' ? cats.find((c) => c.slug === ed) : evs.find((x) => String(x.id) === ed);
          paint(root); return window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        const del = t.closest('[data-del]')?.dataset.del;
        if (del) {
          const what = tab === 'treinos' ? 'este treino' : tab === 'categorias' ? 'esta categoria e todos os treinos dela' : 'este evento';
          if (!(await confirmDialog(`Apagar ${what}?`, 'Apagar'))) return;
          try {
            if (tab === 'treinos') await withLoading(ctx.store.deleteJorney(+del));
            else if (tab === 'categorias') await withLoading(ctx.store.deleteCategory(del));
            else await withLoading(ctx.store.deleteEvent(+del));
            toast('Apagado.', 'ok'); paint(root);
          } catch (err) { showError(err); }
        }
        if (t.id === 'copyKey') {
          const k = body.querySelector('#kbox').textContent;
          try { await navigator.clipboard.writeText(k); toast('Chave copiada.', 'ok'); } catch { getSelection().selectAllChildren(body.querySelector('#kbox')); }
        }
        if (t.id === 'genKey') {
          const a = new Uint32Array(2); crypto.getRandomValues(a);
          body.querySelector('#nkey').value = 'VAGS-' + a[0].toString(36).toUpperCase().slice(0, 4) + '-' + a[1].toString(36).toUpperCase().slice(0, 4);
        }
      });
      body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
          if (f.id === 'kf') {
            const k = f.nkey.value.trim();
            if (k.length < 6) return toast('A chave precisa ter pelo menos 6 caracteres.', 'err');
            await withLoading(ctx.store.setInviteKey(k)); toast('Chave trocada.', 'ok'); return paint(root);
          }
          if (tab === 'treinos') {
            const j = { category: f.jcat.value, difficulty: f.jdif.value, title: f.jtit.value.trim(), xpps: Math.max(1, Math.min(20, +f.jxp.value || 1)),
              description: f.jdesc.value.trim() || null, tip: f.jtip.value.trim() || null, media_url: f.jmed.value.trim() || null, sort: +f.jsort.value || 0 };
            if (j.title.length < 2) return toast('Dê um título ao treino.', 'err');
            if (j.media_url && !/^https:\/\//.test(j.media_url)) return toast('O link do vídeo precisa começar com https://', 'err');
            if (editing !== 'new') j.id = editing.id;
            await withLoading(ctx.store.saveJorney(j));
          } else if (tab === 'categorias') {
            const isNew = editing === 'new';
            const c = { slug: isNew ? f.cslug.value.trim().toLowerCase() : editing.slug, title: f.ctit.value.trim(), description: f.cdesc.value.trim() || null, sort: +f.csort.value || 0 };
            if (!/^[a-z0-9-]{2,30}$/.test(c.slug)) return toast('O código precisa ter letras minúsculas, números ou hífen.', 'err');
            if (c.title.length < 2) return toast('Dê um nome à categoria.', 'err');
            await withLoading(ctx.store.saveCategory(c, isNew));
          } else {
            const ev = { title: f.etit.value.trim(), place: f.eplace.value.trim() || null, description: f.edesc.value.trim() || null, starts_at: new Date(f.ewhen.value).toISOString() };
            if (ev.title.length < 2) return toast('Dê um título ao evento.', 'err');
            if (!f.ewhen.value) return toast('Escolha a data e a hora.', 'err');
            if (editing !== 'new') ev.id = editing.id;
            await withLoading(ctx.store.saveEvent(ev));
          }
          toast('Salvo.', 'ok'); editing = null; paint(root);
        } catch (err) { showError(err); }
      });
    },
  };
}
