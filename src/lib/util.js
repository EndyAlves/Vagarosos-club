import { POS } from '../data/content.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fmtInt = (n) => Number(n || 0).toLocaleString('pt-BR');

export function timeAgo(date) {
  const s = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return 'agora';
  const m = Math.round(s / 60); if (m < 60) return `${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h`;
  const d = Math.round(h / 24); if (d < 7) return `${d} d`;
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function fullDate(date) {
  const d = new Date(date);
  return `${d.toLocaleDateString('pt-BR')} às ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// dd/mm/aaaa <-> aaaa-mm-dd
export function brToIso(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) || d.getDate() !== +m[1] ? null : iso;
}
export const isoToBr = (s) => (s ? s.split('-').reverse().join('/') : '');

// Ícone da posição (círculo colorido com a sigla)
export function posIcon(k) {
  const p = POS[k];
  if (!p) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="${p.color}"/><text x="20" y="26" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${k.length > 1 ? 15 : 18}" fill="#fff">${k}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Foto de perfil: a do usuário ou um avatar com as iniciais
export function avatarUrl(user) {
  if (user?.avatar_url) return user.avatar_url;
  const name = user?.username || '?';
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,45%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},70%,30%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="63" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="38" fill="#fff">${esc(name.slice(0, 2).toUpperCase())}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Reduz a imagem antes de enviar (economiza dados e armazenamento)
export function compressImage(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).'));
    if (file.size > 15 * 1024 * 1024) return reject(new Error('Imagem muito grande. Escolha uma com menos de 15 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => {
        if (b && b.type === 'image/webp') return resolve(b);
        c.toBlob((j) => (j ? resolve(j) : reject(new Error('Não foi possível ler a imagem.'))), 'image/jpeg', quality);
      }, 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}

export const blobToDataUrl = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });

// Mensagens de erro do servidor em português
export function friendlyError(err) {
  const msg = String(err?.message || err || '');
  const map = [
    [/invalid login credentials/i, 'Username ou senha incorretos.'],
    [/invalid_invite_key|bad_key/i, 'Secret Key inválida. Peça a chave a um Membro Oficial.'],
    [/username_taken|already registered|taken/i, 'Esse username já é de outro Vagaroso.'],
    [/invalid_username|bad_username/i, 'O username precisa ter de 3 a 20 letras minúsculas, números, ponto ou _.'],
    [/rate_limit/i, 'Calma! Você publicou muitas vezes em pouco tempo. Tente de novo em alguns minutos.'],
    [/too_fast/i, 'Treino rápido demais. Aguarde um instante.'],
    [/daily_cap/i, 'Você atingiu o limite de XP de hoje. Volte amanhã!'],
    [/password should be at least|weak password/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/key_too_short/i, 'A chave precisa ter pelo menos 6 caracteres.'],
    [/forbidden|row-level security|permission denied/i, 'Você não tem permissão para fazer isso.'],
    [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet.'],
    [/database error saving new user/i, 'Não foi possível criar a conta. Confira a Secret Key e o username.'],
    [/payload too large|exceeded the maximum allowed size/i, 'Imagem muito grande.'],
  ];
  for (const [re, txt] of map) if (re.test(msg)) return txt;
  return msg || 'Algo deu errado. Tente de novo.';
}
