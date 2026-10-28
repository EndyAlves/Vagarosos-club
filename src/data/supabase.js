// Camada de dados usando o Supabase (modo real, multiusuário)
import { createClient } from '@supabase/supabase-js';

const EMAIL_DOMAIN = 'membros.vagarosos.club'; // e-mail interno: username@membros.vagarosos.club
const toEmail = (u) => `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

const POST_SELECT = `id, text, image_url, created_at,
  author:profiles!posts_author_id_fkey ( id, username, avatar_url, position ),
  likes ( user_id ),
  comments ( id, text, created_at, author:profiles!comments_author_id_fkey ( id, username ) )`;

const PROFILE_PUBLIC = 'id, username, full_name, position, height, birth, bio, avatar_url, onboarded, experience, level, xp_by_category, is_admin, created_at';

export function createSupabaseStore(url, key, extraAuth = {}) {
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, ...extraAuth } });
  let uid = null;

  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const sortComments = (p) => ({ ...p, comments: (p.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) });

  async function upload(bucket, blob) {
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    ok(await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }));
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  function storagePath(bucket, publicUrl) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const i = publicUrl ? publicUrl.indexOf(marker) : -1;
    return i < 0 ? null : decodeURIComponent(publicUrl.slice(i + marker.length));
  }

  return {
    mode: 'supabase',

    async currentUser() {
      const { data } = await sb.auth.getSession();
      uid = data.session?.user?.id || null;
      if (!uid) return null;
      return ok(await sb.from('profiles').select(PROFILE_PUBLIC).eq('id', uid).single());
    },
    onAuthChange(cb) {
      sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') { uid = null; cb(null); } });
    },
    async signIn(username, password) {
      ok(await sb.auth.signInWithPassword({ email: toEmail(username), password }));
      return this.currentUser();
    },
    async signUp({ username, password, inviteKey }) {
      const check = ok(await sb.rpc('check_signup', { p_username: username, p_key: inviteKey }));
      if (check !== 'ok') throw new Error(check);
      const res = ok(await sb.auth.signUp({
        email: toEmail(username), password,
        options: { data: { username: username.trim().toLowerCase(), invite_key: inviteKey } },
      }));
      if (!res.session) throw new Error('Conta criada, mas o login automático falhou. No Supabase, desative "Confirm email" em Authentication → Providers → Email.');
      return this.currentUser();
    },
    async signOut() { await sb.auth.signOut(); uid = null; },

    async updateProfile(fields, avatarBlob) {
      const patch = { ...fields };
      if (avatarBlob) patch.avatar_url = await upload('avatars', avatarBlob);
      return ok(await sb.from('profiles').update(patch).eq('id', uid).select(PROFILE_PUBLIC).single());
    },
    async profileByUsername(username) {
      return ok(await sb.from('profiles').select(PROFILE_PUBLIC).eq('username', username.toLowerCase()).maybeSingle());
    },
    async ranking() {
      return ok(await sb.from('profiles').select('id, username, avatar_url, position, level, experience')
        .eq('onboarded', true).order('experience', { ascending: false }).limit(100));
    },
    async stats(userId) {
      const count = async (q) => (await q).count || 0;
      const [posts, events] = await Promise.all([
        count(sb.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId)),
        count(sb.from('event_attendees').select('event_id', { count: 'exact', head: true }).eq('user_id', userId)),
      ]);
      const mine = ok(await sb.from('posts').select('likes(count)').eq('author_id', userId).limit(500));
      const likes = mine.reduce((s, p) => s + (p.likes?.[0]?.count || 0), 0);
      return { posts, events, likes };
    },

    async feed({ before, authorId } = {}) {
      let q = sb.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(15);
      if (before) q = q.lt('created_at', before);
      if (authorId) q = q.eq('author_id', authorId);
      return ok(await q).map(sortComments);
    },
    async post(id) {
      return sortComments(ok(await sb.from('posts').select(POST_SELECT).eq('id', id).single()));
    },
    async createPost(text, imageBlob) {
      const image_url = imageBlob ? await upload('posts', imageBlob) : null;
      ok(await sb.from('posts').insert({ text: text || null, image_url }));
    },
    async deletePost(post) {
      ok(await sb.from('posts').delete().eq('id', post.id));
      const path = storagePath('posts', post.image_url);
      if (path && path.startsWith(uid + '/')) await sb.storage.from('posts').remove([path]);
    },
    async toggleLike(postId, liked) {
      if (liked) ok(await sb.from('likes').delete().eq('post_id', postId).eq('user_id', uid));
      else {
        const { error } = await sb.from('likes').insert({ post_id: postId });
        if (error && error.code !== '23505') throw error;
      }
    },
    async addComment(postId, text) { ok(await sb.from('comments').insert({ post_id: postId, text })); },
    async deleteComment(id) { ok(await sb.from('comments').delete().eq('id', id)); },

    async categories() {
      const rows = ok(await sb.from('categories').select('slug, title, description, sort, jorneys(count)').order('sort'));
      return rows.map((c) => ({ ...c, count: c.jorneys?.[0]?.count || 0 }));
    },
    async jorneys(category) {
      let q = sb.from('jorneys').select('*').order('sort').order('id');
      if (category) q = q.eq('category', category);
      return ok(await q);
    },
    async jorney(id) { return ok(await sb.from('jorneys').select('*').eq('id', id).maybeSingle()); },
    async trainTick(id) { return ok(await sb.rpc('train_tick', { p_jorney: id })); },

    async events() {
      const since = new Date(Date.now() - 12 * 3600e3).toISOString();
      const rows = ok(await sb.from('events').select('*, event_attendees ( user_id, profile:profiles!event_attendees_user_id_fkey ( username, avatar_url ) )')
        .gte('starts_at', since).order('starts_at'));
      return rows.map((e) => ({ ...e, attendees: (e.event_attendees || []).map((a) => ({ user_id: a.user_id, ...a.profile })) }));
    },
    async toggleGoing(eventId, going) {
      if (going) ok(await sb.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', uid));
      else {
        const { error } = await sb.from('event_attendees').insert({ event_id: eventId });
        if (error && error.code !== '23505') throw error;
      }
    },

    async notifications() {
      return ok(await sb.from('notifications')
        .select('id, type, read, created_at, post_id, data, actor:profiles!notifications_actor_id_fkey ( username, avatar_url )')
        .order('created_at', { ascending: false }).limit(40));
    },
    async unreadCount() {
      const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false);
      return count || 0;
    },
    async markAllRead() { ok(await sb.from('notifications').update({ read: true }).eq('read', false)); },

    subscribe(handler) {
      const ch = sb.channel('vagarosos-club')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => handler('feed'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => handler('feed'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => handler('feed'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => handler('notif'))
        .subscribe();
      return () => sb.removeChannel(ch);
    },

    // ---------- admin ----------
    async saveCategory(c, isNew) {
      if (isNew) ok(await sb.from('categories').insert(c));
      else ok(await sb.from('categories').update({ title: c.title, description: c.description, sort: c.sort }).eq('slug', c.slug));
    },
    async deleteCategory(slug) { ok(await sb.from('categories').delete().eq('slug', slug)); },
    async saveJorney(j) {
      const { id, ...rest } = j;
      if (id) ok(await sb.from('jorneys').update(rest).eq('id', id));
      else ok(await sb.from('jorneys').insert(rest));
    },
    async deleteJorney(id) { ok(await sb.from('jorneys').delete().eq('id', id)); },
    async saveEvent(e) {
      const { id, ...rest } = e;
      if (id) ok(await sb.from('events').update(rest).eq('id', id));
      else ok(await sb.from('events').insert(rest));
    },
    async deleteEvent(id) { ok(await sb.from('events').delete().eq('id', id)); },
    async getInviteKey() { return ok(await sb.rpc('get_invite_key')); },
    async setInviteKey(k) { ok(await sb.rpc('set_invite_key', { p_key: k })); },
  };
}
