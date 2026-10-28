// Gera supabase/seed.sql a partir de src/data/content.js
import { writeFileSync } from 'node:fs';
import { SEED_CATEGORIES, SEED_JORNEYS } from '../src/data/content.js';
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
let sql = `-- Conteúdo inicial do Vagarosos Club (categorias, treinos e eventos de exemplo).
-- Rode depois do schema.sql. Pode editar tudo depois pela área de Admin do site.

insert into public.categories (slug, title, description, sort) values
${SEED_CATEGORIES.map((c) => `  (${q(c.slug)}, ${q(c.title)}, ${q(c.description)}, ${c.sort})`).join(',\n')}
on conflict (slug) do nothing;

insert into public.jorneys (category, title, difficulty, xpps, description, tip, sort)
select v.* from (values
${SEED_JORNEYS.map((j) => `  (${q(j.category)}, ${q(j.title)}, ${q(j.difficulty)}, ${j.xpps}, ${q(j.description)}, ${q(j.tip)}, ${j.sort})`).join(',\n')}
) as v(category, title, difficulty, xpps, description, tip, sort)
where not exists (select 1 from public.jorneys);

insert into public.events (title, place, starts_at, description)
select v.* from (values
  ('Racha de Sábado', 'Quadra do Parque do Povo', date_trunc('day', now()) + interval '9 days 9 hours', '5x5 rotativo, quem perde sai. Leve água e camisa clara e escura.'),
  ('Desafio 3PT Vagaroso', 'Ginásio Municipal', date_trunc('day', now()) + interval '23 days 15 hours', 'Torneio de bolas de três em 60 segundos.'),
  ('Vagarosos Cup 3x3', 'Quadra do Parque do Povo', date_trunc('day', now()) + interval '37 days 8 hours', 'Times de 3 sorteados na hora. Inscrições no grupo.')
) as v(title, place, starts_at, description)
where not exists (select 1 from public.events);
`;
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log('seed.sql gerado');
