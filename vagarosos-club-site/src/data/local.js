// Modo demonstração: guarda tudo no navegador (localStorage).
// É usado quando o site roda sem as variáveis do Supabase.
import { SEED_CATEGORIES, SEED_JORNEYS, levelFor, threshold } from './content.js';
import { blobToDataUrl } from '../lib/util.js';

const KEY = 'vagarosos-demo-v2';
export const DEMO_INVITE = 'VAGS-2024';
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());

function seed() {
  const users = [
    ['billy', 'Billy Vagaroso', 'PG', '1,78', '1998-03-12', 9, true],
    ['tio_moogly', 'Tio Moogly', 'C', '1,96', '1990-08-02', 12, false],
    ['kd_lento', 'Kevin Lento', 'SF', '1,90', '1997-09-30', 8, false],
    ['neguinho3pts', 'Neguinho dos 3', 'SG', '1,75', '2000-01-17', 7, false],
    ['magrelo', 'Magrelo Silva', 'PF', '1,93', '1999-05-05', 5, false],
    ['pe_de_breque', 'Pé de Breque', 'PG', '1,70', '2001-11-21', 3, false],
    ['xande_block', 'Xande Block', 'C', '2,01', '1996-07-09', 6, false],
  ].map(([username, full_name, position, height, birth, level, is_admin], i) => {
    const base = level > 1 ? threshold(level - 1) : 0;
    const experience = base + Math.round((threshold(level) - base) * (((i * 37) % 90) + 5) / 100);
    const split = { fundamentals: 0.3, shooting: 0.2, ballhandle: 0.15, finish: 0.15, defense: 0.1, fitness: 0.1 };
    const xp_by_category = Object.fromEntries(Object.entries(split).map(([k, v]) => [k, Math.round(experience * v * (position === 'SG' && k === 'shooting' ? 1.6 : 1))]));
    return { id: 'u' + (i + 1), username, password: 'vags123', full_name, position, height, birth, bio: '', avatar_url: null,
      onboarded: true, experience, level: levelFor(experience), xp_by_category, is_admin, created_at: new Date(Date.now() - (60 - i) * 864e5).toISOString() };
  });
  const now = Date.now(), h = 3600e3, iso = (t) => new Date(t).toISOString();
  const day = (d, hour) => { const x = new Date(); x.setHours(hour, 0, 0, 0); x.setDate(x.getDate() + d); return x.toISOString(); };
  return {
    v: 2,
    session: null,
    invite_key: DEMO_INVITE,
    users,
    categories: SEED_CATEGORIES.map((c) => ({ ...c })),
    jorneys: SEED_JORNEYS.map((j) => ({ ...j })),
    posts: [
      { id: 'p1', author_id: 'u2', text: 'Treino de pivô hoje às 19h na quadra do parque. Quem cola?', image_url: null, created_at: iso(now - 2 * h) },
      { id: 'p2', author_id: 'u4', text: 'Bati 40/50 no Catch & Shoot 3PT. Medalha Sniper tá vindo!', image_url: null, created_at: iso(now - 20 * h) },
      { id: 'p3', author_id: 'u1', text: 'Nova camisa do clube chegando!', image_url: '/img/logo.webp', created_at: iso(now - 50 * h) },
    ],
    comments: [
      { id: 'c1', post_id: 'p1', author_id: 'u1', text: 'Tô dentro, levo a bola nova', created_at: iso(now - 1.5 * h) },
      { id: 'c2', post_id: 'p1', author_id: 'u6', text: 'Chego 19h30, segura uma vaga', created_at: iso(now - 1 * h) },
      { id: 'c3', post_id: 'p2', author_id: 'u3', text: 'Mão quente demais', created_at: iso(now - 18 * h) },
    ],
    likes: [['p1', 'u1'], ['p1', 'u4'], ['p1', 'u5'], ['p2', 'u2'], ['p2', 'u3'], ['p3', 'u2'], ['p3', 'u3'], ['p3', 'u4'], ['p3', 'u5'], ['p3', 'u6'], ['p3', 'u7']]
      .map(([post_id, user_id]) => ({ post_id, user_id })),
    events: [
      { id: 1, title: 'Racha de Sábado', place: 'Quadra do Parque do Povo', starts_at: day(9, 9), description: '5x5 rotativo, quem perde sai. Leve água e camisa clara e escura.' },
      { id: 2, title: 'Desafio 3PT Vagaroso', place: 'Ginásio Municipal', starts_at: day(23, 15), description: 'Torneio de bolas de três em 60 segundos.' },
      { id: 3, title: 'Vagarosos Cup 3x3', place: 'Quadra do Parque do Povo', starts_at: day(37, 8), description: 'Times de 3 sorteados na hora. Inscrições no grupo.' },
    ],
    attendees: [{ event_id: 1, user_id: 'u2' }, { event_id: 1, user_id: 'u3' }, { event_id: 1, user_id: 'u5' }, { event_id: 2, user_id: 'u4' }],
    notifications: [],
  };
}

export function createLocalStore() {
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  if (!db || db.v !== 2) db = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* armazenamento cheio ou bloqueado */ } };
  save();

  const me = () => db.users.find((u) => u.id === db.session) || null;
  const pub = (u) => { if (!u) return null; const { password, ...rest } = u; return { ...rest }; };
  const mini = (id) => { const u = db.users.find((x) => x.id === id); return u ? { id: u.id, username: u.username, avatar_url: u.avatar_url, position: u.position } : { id, username: '?' }; };
  const isAdmin = () => !!me()?.is_admin;
  const need = () => { if (!me()) throw new Error('Faça login de novo.'); };
  const admin = () => { if (!isAdmin()) throw new Error('forbidden'); };
  const notify = (user_id, actor_id, type, post_id, data = {}) => {
    if (user_id === actor_id) return;
    db.notifications.unshift({ id: Date.now() + Math.random(), user_id, actor_id, type, post_id, data, read: false, created_at: new Date().toISOString() });
  };
  const rate = (list, max) => {
    const since = Date.now() - 10 * 60e3;
    if (list.filter((x) => x.author_id === db.session && new Date(x.created_at) > since).length >= max) throw new Error('rate_limit');
  };
  const shapePost = (p) => ({
    id: p.id, text: p.text, image_url: p.image_url, created_at: p.created_at, author: mini(p.author_id),
    likes: db.likes.filter((l) => l.post_id === p.id).map((l) => ({ user_id: l.user_id })),
    comments: db.comments.filter((c) => c.post_id === p.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((c) => ({ id: c.id, text: c.text, created_at: c.created_at, author: mini(c.author_id) })),
  });
  let lastTick = 0;

  return {
    mode: 'local',
    demoInvite: DEMO_INVITE,
    reset() { db = seed(); save(); },

    async currentUser() { return pub(me()); },
    onAuthChange() {},
    async signIn(username, password) {
      await wait(350);
      const u = db.users.find((x) => x.username === username.trim().toLowerCase());
      if (!u || u.password !== password) throw new Error('Invalid login credentials');
      db.session = u.id; save(); return pub(u);
    },
    async signUp({ username, password, inviteKey }) {
      await wait(400);
      const name = username.trim().toLowerCase();
      if (!/^[a-z0-9._]{3,20}$/.test(name)) throw new Error('bad_username');
      if (db.users.some((x) => x.username === name)) throw new Error('taken');
      if (inviteKey !== db.invite_key) throw new Error('bad_key');
      if (password.length < 6) throw new Error('Password should be at least 6 characters');
      const u = { id: uuid(), username: name, password, full_name: '', position: null, height: '', birth: null, bio: '', avatar_url: null,
        onboarded: false, experience: 0, level: 1, xp_by_category: {}, is_admin: false, created_at: new Date().toISOString() };
      db.users.push(u); db.session = u.id; save(); return pub(u);
    },
    async signOut() { db.session = null; save(); },

    async updateProfile(fields, avatarBlob) {
      need(); await wait();
      const u = me();
      const allowed = ['full_name', 'position', 'height', 'birth', 'bio', 'onboarded'];
      for (const k of allowed) if (k in fields) u[k] = fields[k];
      if (avatarBlob) u.avatar_url = await blobToDataUrl(avatarBlob);
      save(); return pub(u);
    },
    async profileByUsername(username) { return pub(db.users.find((u) => u.username === username.toLowerCase())); },
    async ranking() {
      return db.users.filter((u) => u.onboarded).sort((a, b) => b.experience - a.experience)
        .map(({ id, username, avatar_url, position, level, experience }) => ({ id, username, avatar_url, position, level, experience }));
    },
    async stats(userId) {
      const mine = db.posts.filter((p) => p.author_id === userId).map((p) => p.id);
      return { posts: mine.length, likes: db.likes.filter((l) => mine.includes(l.post_id)).length, events: db.attendees.filter((a) => a.user_id === userId).length };
    },

    async feed({ before, authorId } = {}) {
      await wait(150);
      return db.posts.filter((p) => (!before || p.created_at < before) && (!authorId || p.author_id === authorId))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 15).map(shapePost);
    },
    async post(id) { const p = db.posts.find((x) => x.id === id); if (!p) throw new Error('Post não encontrado.'); return shapePost(p); },
    async createPost(text, imageBlob) {
      need(); rate(db.posts, 5); await wait(300);
      const image_url = imageBlob ? await blobToDataUrl(imageBlob) : null;
      db.posts.push({ id: uuid(), author_id: db.session, text: text || null, image_url, created_at: new Date().toISOString() }); save();
    },
    async deletePost(post) {
      need(); const p = db.posts.find((x) => x.id === post.id);
      if (!p || (p.author_id !== db.session && !isAdmin())) throw new Error('forbidden');
      db.posts = db.posts.filter((x) => x.id !== p.id);
      db.comments = db.comments.filter((c) => c.post_id !== p.id);
      db.likes = db.likes.filter((l) => l.post_id !== p.id); save();
    },
    async toggleLike(postId, liked) {
      need();
      if (liked) db.likes = db.likes.filter((l) => !(l.post_id === postId && l.user_id === db.session));
      else if (!db.likes.some((l) => l.post_id === postId && l.user_id === db.session)) {
        db.likes.push({ post_id: postId, user_id: db.session });
        notify(db.posts.find((p) => p.id === postId)?.author_id, db.session, 'like', postId);
      }
      save();
    },
    async addComment(postId, text) {
      need(); rate(db.comments, 20); await wait(150);
      db.comments.push({ id: uuid(), post_id: postId, author_id: db.session, text, created_at: new Date().toISOString() });
      notify(db.posts.find((p) => p.id === postId)?.author_id, db.session, 'comment', postId, { text: text.slice(0, 80) }); save();
    },
    async deleteComment(id) {
      need(); const c = db.comments.find((x) => x.id === id); const p = c && db.posts.find((x) => x.id === c.post_id);
      if (!c || (c.author_id !== db.session && p?.author_id !== db.session && !isAdmin())) throw new Error('forbidden');
      db.comments = db.comments.filter((x) => x.id !== id); save();
    },

    async categories() {
      return [...db.categories].sort((a, b) => a.sort - b.sort).map((c) => ({ ...c, count: db.jorneys.filter((j) => j.category === c.slug).length }));
    },
    async jorneys(category) { return db.jorneys.filter((j) => !category || j.category === category).sort((a, b) => a.sort - b.sort || a.id - b.id); },
    async jorney(id) { return db.jorneys.find((j) => j.id === +id) || null; },
    async trainTick(id) {
      need();
      if (Date.now() - lastTick < 1500) throw new Error('too_fast');
      lastTick = Date.now();
      const j = db.jorneys.find((x) => x.id === +id); const u = me();
      const gain = j.xpps * 2; const old = u.level;
      u.experience += gain; u.level = levelFor(u.experience);
      u.xp_by_category[j.category] = (u.xp_by_category[j.category] || 0) + gain;
      if (u.level > old) db.notifications.unshift({ id: Date.now(), user_id: u.id, type: 'level', data: { level: u.level }, read: false, created_at: new Date().toISOString() });
      save();
      return { gain, leveled_up: u.level > old, level: u.level, experience: u.experience, xp_by_category: { ...u.xp_by_category } };
    },

    async events() {
      const since = Date.now() - 12 * 3600e3;
      return db.events.filter((e) => new Date(e.starts_at) > since).sort((a, b) => (a.starts_at > b.starts_at ? 1 : -1))
        .map((e) => ({ ...e, attendees: db.attendees.filter((a) => a.event_id === e.id).map((a) => ({ user_id: a.user_id, ...mini(a.user_id) })) }));
    },
    async toggleGoing(eventId, going) {
      need();
      if (going) db.attendees = db.attendees.filter((a) => !(a.event_id === eventId && a.user_id === db.session));
      else db.attendees.push({ event_id: eventId, user_id: db.session });
      save();
    },

    async notifications() {
      return db.notifications.filter((n) => n.user_id === db.session).slice(0, 40)
        .map((n) => ({ ...n, actor: n.actor_id ? mini(n.actor_id) : null }));
    },
    async unreadCount() { return db.notifications.filter((n) => n.user_id === db.session && !n.read).length; },
    async markAllRead() { db.notifications.forEach((n) => { if (n.user_id === db.session) n.read = true; }); save(); },
    subscribe() { return () => {}; },

    async saveCategory(c, isNew) {
      admin();
      if (isNew) { if (db.categories.some((x) => x.slug === c.slug)) throw new Error('Já existe uma categoria com esse código.'); db.categories.push({ ...c }); }
      else Object.assign(db.categories.find((x) => x.slug === c.slug), c);
      save();
    },
    async deleteCategory(slug) { admin(); db.categories = db.categories.filter((c) => c.slug !== slug); db.jorneys = db.jorneys.filter((j) => j.category !== slug); save(); },
    async saveJorney(j) {
      admin();
      if (j.id) Object.assign(db.jorneys.find((x) => x.id === j.id), j);
      else db.jorneys.push({ ...j, id: Math.max(0, ...db.jorneys.map((x) => x.id)) + 1 });
      save();
    },
    async deleteJorney(id) { admin(); db.jorneys = db.jorneys.filter((j) => j.id !== id); save(); },
    async saveEvent(e) {
      admin();
      if (e.id) Object.assign(db.events.find((x) => x.id === e.id), e);
      else db.events.push({ ...e, id: Math.max(0, ...db.events.map((x) => x.id)) + 1 });
      save();
    },
    async deleteEvent(id) { admin(); db.events = db.events.filter((e) => e.id !== id); save(); },
    async getInviteKey() { admin(); return db.invite_key; },
    async setInviteKey(k) { admin(); if (k.trim().length < 6) throw new Error('key_too_short'); db.invite_key = k.trim(); save(); },
  };
}
