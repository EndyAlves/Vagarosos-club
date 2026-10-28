-- Conteúdo inicial do Vagarosos Club (categorias, treinos e eventos de exemplo).
-- Rode depois do schema.sql. Pode editar tudo depois pela área de Admin do site.

insert into public.categories (slug, title, description, sort) values
  ('fundamentals', 'Fundamentals', 'A base de tudo: postura, passe, drible e arremesso. Todo Vagaroso começa por aqui.', 1),
  ('shooting', 'Shooting', 'Mecânica, média distância e bola de três. Treinos para pontuar sobre qualquer defesa.', 2),
  ('ballhandle', 'Ball Handle', 'Crossovers, combos e proteção de bola sob pressão defensiva.', 3),
  ('finish', 'Finish', 'Bandejas, floaters, euro-step e infiltrações para terminar a jogada na cesta.', 4),
  ('defense', 'Defense', 'Defesa de perímetro, roubos de bola, rebote e proteção do aro.', 5),
  ('fitness', 'Fitness', 'Velocidade, força e resistência para aguentar os quatro quartos.', 6)
on conflict (slug) do nothing;

insert into public.jorneys (category, title, difficulty, xpps, description, tip, sort)
select v.* from (values
  ('fundamentals', 'Triple Threat', 'easy', 4, 'Receba a bola e assuma a posição de tripla ameaça: pés na largura dos ombros, joelhos flexionados, bola protegida no quadril. Repita 50 vezes alternando o pé de pivô.', 'Olhos sempre na cesta. Quem olha pra bola não vê o jogo.', 1),
  ('fundamentals', 'Chest & Bounce Pass', 'easy', 4, 'Em dupla ou contra a parede, 3 séries de 30 passes de peito e 30 quicados, mantendo distância de 4 metros.', 'O quique tem que acontecer a 2/3 da distância até o recebedor.', 2),
  ('fundamentals', 'Form Shooting', 'medium', 6, 'Arremessos a um metro do aro, só com a mão de arremesso. Suba a distância a cada 10 acertos.', 'Cotovelo alinhado com o joelho e follow-through até a bola tocar o aro.', 3),
  ('fundamentals', 'Defensive Slides', 'medium', 6, 'Deslocamento lateral de linha a linha do garrafão, 6 idas e voltas por série, 4 séries.', 'Não cruze os pés e mantenha o quadril baixo o tempo todo.', 4),
  ('shooting', 'Spot Up 5 Pontos', 'easy', 5, 'Arremessos de média distância em 5 pontos da quadra. 10 acertos em cada ponto antes de avançar.', 'Pés prontos antes da bola chegar.', 5),
  ('shooting', 'Pull Up Jumper', 'medium', 7, 'Dois dribles e arremesso parando no tempo certo, saindo para os dois lados.', 'Pare com os dois pés juntos, sem desequilibrar o corpo pra frente.', 6),
  ('shooting', 'Catch & Shoot 3PT', 'hard', 9, 'Recebe saindo do corta-luz e arremessa de três em menos de 1 segundo. 5 séries de 10.', 'Dobre os joelhos já na corrida; a força vem das pernas.', 7),
  ('shooting', 'Step Back', 'hard', 10, 'Drible de ataque, step back e arremesso. Alterne entre média distância e linha de três.', 'O passo pra trás cria o espaço; não precisa ser grande, precisa ser rápido.', 8),
  ('ballhandle', 'Pound Dribbles', 'easy', 4, 'Dribles fortes na altura da cintura, 30 segundos com cada mão, 5 séries.', 'Bata a bola com força: quanto mais rápido ela volta, menos tempo fica exposta.', 9),
  ('ballhandle', 'Crossover Series', 'medium', 6, 'Crossover baixo, between the legs e behind the back em sequência, de uma linha de fundo à outra.', 'Mude de velocidade, não só de direção.', 10),
  ('ballhandle', 'Killer Combos', 'hard', 9, 'Combos de 3 dribles sem olhar pra bola, com cones de obstáculo e finalização.', 'Treine devagar e certo antes de treinar rápido e errado.', 11),
  ('finish', 'Mikan Drill', 'easy', 5, 'Bandejas alternadas embaixo do aro, mão direita e esquerda, sem deixar a bola cair. 3 séries de 1 minuto.', 'Use a tabela. O quadrado foi pintado ali por um motivo.', 12),
  ('finish', 'Euro Step', 'medium', 7, 'Infiltração com euro-step contra um cone, finalizando dos dois lados.', 'O primeiro passo vende a ida; o segundo é que leva você à cesta.', 13),
  ('finish', 'Floater Game', 'hard', 8, 'Floaters de dentro do garrafão, saindo do drible, sobre um defensor imaginário alto.', 'Solte a bola no ponto mais alto do salto, com arco.', 14),
  ('defense', 'Closeout Drill', 'medium', 6, 'Corrida do garrafão até o arremessador, freando com passos curtos e mão alta.', 'Chegue em controle; closeout descontrolado é bandeja de graça.', 15),
  ('defense', 'Shell Rotation', 'hard', 8, 'Rotações defensivas 4x4 acompanhando a posição da bola.', 'Fale o tempo todo. Defesa boa é defesa barulhenta.', 16),
  ('fitness', 'Suicide Runs', 'medium', 7, 'Corridas de linha a linha (lance livre, meio, lance livre oposto, fundo). 6 repetições.', 'Toque a linha com a mão em cada virada.', 17),
  ('fitness', 'Vertical Jumps', 'hard', 9, 'Saltos verticais com aterrissagem controlada, 5 séries de 10, descanso de 1 minuto.', 'Aterrisse com os joelhos flexionados e alinhados com os pés.', 18)
) as v(category, title, difficulty, xpps, description, tip, sort)
where not exists (select 1 from public.jorneys);

insert into public.events (title, place, starts_at, description)
select v.* from (values
  ('Racha de Sábado', 'Quadra do Parque do Povo', date_trunc('day', now()) + interval '9 days 9 hours', '5x5 rotativo, quem perde sai. Leve água e camisa clara e escura.'),
  ('Desafio 3PT Vagaroso', 'Ginásio Municipal', date_trunc('day', now()) + interval '23 days 15 hours', 'Torneio de bolas de três em 60 segundos.'),
  ('Vagarosos Cup 3x3', 'Quadra do Parque do Povo', date_trunc('day', now()) + interval '37 days 8 hours', 'Times de 3 sorteados na hora. Inscrições no grupo.')
) as v(title, place, starts_at, description)
where not exists (select 1 from public.events);
