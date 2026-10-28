// Página inicial pública (entrar) e cadastro
import { esc } from '../lib/util.js';
import { withLoading, showError, toast } from '../ui.js';

const userIcon = `<svg width="12" height="13" aria-hidden="true"><path fill="#B1B7C4" d="M8.9,7.2C9,6.9,9,6.7,9,6.5v-4C9,1.1,7.9,0,6.5,0h-1C4.1,0,3,1.1,3,2.5v4c0,0.2,0,0.4,0.1,0.7 C1.3,7.8,0,9.5,0,11.5V13h12v-1.5C12,9.5,10.7,7.8,8.9,7.2z M4,2.5C4,1.7,4.7,1,5.5,1h1C7.3,1,8,1.7,8,2.5v4c0,0.2,0,0.4-0.1,0.6 l0.1,0L7.9,7.3C7.6,7.8,7.1,8.2,6.5,8.2h-1c-0.6,0-1.1-0.4-1.4-0.9L4.1,7.1l0.1,0C4,6.9,4,6.7,4,6.5V2.5z M11,12H1v-0.5 c0-1.6,1-2.9,2.4-3.4c0.5,0.7,1.2,1.1,2.1,1.1h1c0.8,0,1.6-0.4,2.1-1.1C10,8.5,11,9.9,11,11.5V12z"/></svg>`;
const keyIcon = `<svg width="15" height="5" aria-hidden="true"><path fill="#B1B7C4" d="M6,2L6,2c0-1.1-1-2-2.1-2H2.1C1,0,0,0.9,0,2.1v0.8C0,4.1,1,5,2.1,5h1.7C5,5,6,4.1,6,2.9V3h5v1h1V3h1v2h1V3h1 V2H6z M5.1,2.9c0,0.7-0.6,1.2-1.3,1.2H2.1c-0.7,0-1.3-0.6-1.3-1.2V2.1c0-0.7,0.6-1.2,1.3-1.2h1.7c0.7,0,1.3,0.6,1.3,1.2V2.9z"/></svg>`;

function hero() {
  return `<section class="hero">
    <h1 class="tx-vg">Vagarosos<small>Club</small></h1>
    <p class="tagline">Treine, ganhe XP e suba no ranking do clube.</p>
    <p class="lead">A rede dos Vagarosos: jornadas de treino de basquete, medalhas por fundamento, eventos e o feed da galera. Acesso só para membros.</p>
    <ul class="features">
      <li><img src="/img/ball.webp" alt="" width="38" height="38"><div><b>Jornadas de treino</b>Shooting, ball handle, defesa e mais, com XP por segundo.</div></li>
      <li><img src="/img/trophy.webp" alt="" width="38" height="38"><div><b>41 medalhas</b>Do I Beggin ao Agent 3, em bronze, prata e ouro.</div></li>
      <li><img src="/img/player.webp" alt="" width="38" height="38"><div><b>Ranking e eventos</b>Rachas, desafios de 3 pontos e quem tá on fire.</div></li>
    </ul>
    <div class="lineup" aria-hidden="true">
      ${['pg', 'sg', 'sf', 'pf', 'c'].map((p) => `<img src="/img/pos-${p}.webp" alt="" loading="lazy" height="170">`).join('')}
    </div>
  </section>`;
}

export function loginView(ctx) {
  const demo = ctx.store.mode === 'local';
  return {
    title: 'Entrar',
    html: `<main class="landing">
      ${hero()}
      <form class="auth-card" id="loginForm" novalidate>
        <div class="img-logo"><img src="/img/logo.webp" alt="Logo Vagarosos Club" width="120" height="120"></div>
        <div class="lf-row"><label class="lf-label" for="username">${userIcon}<span class="sr-only">Username</span></label>
          <input id="username" class="lf-input" placeholder="Username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
        <div class="lf-row"><label class="lf-label" for="password">${keyIcon}<span class="sr-only">Senha</span></label>
          <input id="password" class="lf-input" type="password" placeholder="Password" autocomplete="current-password" required></div>
        <button class="btn-grad" type="submit">LOGIN</button>
        <a class="btn-grad" href="/cadastro" data-link style="text-align:center">CADASTRAR</a>
        ${demo ? `<p class="auth-note">Modo demonstração. Entre com <b>billy</b> / <b>vags123</b>.<br>Chave de membro para cadastro: <b>${esc(ctx.store.demoInvite)}</b><br><button type="button" class="linkish" id="resetDemo">Restaurar dados de exemplo</button></p>`
               : '<p class="auth-note">Ainda não é membro? Peça a Secret Key a um Membro Oficial.</p>'}
      </form>
    </main>`,
    bind(root) {
      const f = root.querySelector('#loginForm');
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = f.username.value.trim(), p = f.password.value;
        if (!u || !p) return toast('Preencha username e senha.', 'err');
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        try { const me = await withLoading(ctx.store.signIn(u, p)); await ctx.loggedIn(me); }
        catch (err) { showError(err); btn.disabled = false; }
      });
      root.querySelector('#resetDemo')?.addEventListener('click', () => { ctx.store.reset(); toast('Dados de exemplo restaurados.', 'ok'); });
    },
  };
}

export function signupView(ctx) {
  return {
    title: 'Cadastro',
    html: `<main class="landing">
      ${hero()}
      <div>
        <a class="effectback" href="/" data-link>Voltar</a>
        <form class="auth-card" id="cadForm" novalidate>
          <h2 class="tx-vg">Novo Vagaroso</h2>
          <div class="lf-row"><label class="lf-label" for="cu">${userIcon}<span class="sr-only">Username</span></label>
            <input id="cu" class="lf-input" placeholder="Username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20"></div>
          <div class="lf-row"><label class="lf-label" for="cp">${keyIcon}<span class="sr-only">Senha</span></label>
            <input id="cp" class="lf-input" type="password" placeholder="Senha (mín. 6)" autocomplete="new-password"></div>
          <div class="lf-row"><label class="lf-label" for="cc">${keyIcon}<span class="sr-only">Confirmar senha</span></label>
            <input id="cc" class="lf-input" type="password" placeholder="Confirmar senha" autocomplete="new-password"></div>
          <div class="lf-row" style="margin:1.4em 0 .4em"><label class="lf-label" for="ck" style="background:#ffe7c7">🔑<span class="sr-only">Secret Key</span></label>
            <input id="ck" class="lf-input" type="password" placeholder="Secret Key Member Invite" autocomplete="off"></div>
          <p class="auth-note" style="text-align:left;margin:0 0 16px">A Secret Key é oferecida por um membro oficial da comunidade.</p>
          <button type="submit" class="btn-grad">CADASTRAR</button>
        </form>
      </div>
    </main>`,
    bind(root) {
      const f = root.querySelector('#cadForm');
      f.cu.addEventListener('input', () => { f.cu.value = f.cu.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = f.cu.value.trim(), password = f.cp.value, confirm = f.cc.value, inviteKey = f.ck.value.trim();
        if (!/^[a-z0-9._]{3,20}$/.test(username)) return toast('O username precisa ter de 3 a 20 letras minúsculas, números, ponto ou _.', 'err');
        if (password.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.', 'err');
        if (password !== confirm) return toast('As senhas não conferem.', 'err');
        if (!inviteKey) return toast('Informe a Secret Key de membro.', 'err');
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        try { const me = await withLoading(ctx.store.signUp({ username, password, inviteKey })); toast('Conta criada! Bem-vindo ao clube.', 'ok'); await ctx.loggedIn(me); }
        catch (err) { showError(err); btn.disabled = false; }
      });
    },
  };
}
