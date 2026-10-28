// Conteúdo fixo do clube: posições, medalhas, fórmula de nível
// e o conteúdo inicial (categorias, treinos e eventos) usado no modo demo
// e no supabase/seed.sql.

export const POS = {
  PG: { name: 'Point Guard', color: '#18a837', img: '/img/pos-pg.webp',
    desc: 'Peritos em passes e no controle de bola, os armadores (Point Guards) ditam o ritmo do jogo e coordenam as jogadas.' },
  SG: { name: 'Shooting Guard', color: '#d47a12', img: '/img/pos-sg.webp',
    desc: 'Especialistas em arremessos, os Shooting Guards (SG) são exímios finalizadores e jogadores versáteis na quadra.' },
  SF: { name: 'Small Forward', color: '#18a8bb', img: '/img/pos-sf.webp',
    desc: 'Combinando altura, força e habilidade, os Small Forwards (SF) são jogadores polivalentes que desempenham múltiplas funções.' },
  PF: { name: 'Power Forward', color: '#1822a8', img: '/img/pos-pf.webp',
    desc: 'Fortes e poderosos, os Power Forwards (PF) são fundamentais no ataque e na defesa, no perímetro e no garrafão.' },
  C: { name: 'Center', color: '#a81818', img: '/img/pos-c.webp',
    desc: 'Os pivôs (Centers) dominam o garrafão, com foco em rebotes, bloqueios e presença física.' },
};

// XP total necessário para passar do nível L (igual à função level_for no banco)
export const threshold = (l) => 600 + l * l * 250;
export function levelFor(xp) { let l = 1; while (xp >= threshold(l)) l++; return l; }
export function levelProgress(xp) {
  const l = levelFor(xp);
  const prev = l > 1 ? threshold(l - 1) : 0;
  const next = threshold(l);
  return { level: l, prev, next, pct: Math.max(0, Math.min(100, ((xp - prev) / (next - prev)) * 100)) };
}

// Medalhas (do medalhas.txt do projeto original).
// src = categoria de treino cujo XP conta para a medalha ('total' = XP geral)
const M = [
  ['I Beggin', 'Toda jornada tem seu começo.', 'Geral', [1200, 4000, 8000], 'total'],
  ['Well Oriented', 'Aplicou-se bem no fundamento e está bem orientado para qualquer tipo de treino.', 'Geral', [3000, 9500, 15000], 'fundamentals'],
  ['Sniper Shootings', 'Especializou seus arremessos para pontuar ainda mais sobre a defesa.', 'Shooting', [30000, 62000, 95000], 'shooting'],
  ['Middle Magic', 'Seus arremessos de média distância estão em alto nível.', 'Shooting', [38000, 70000, 105000], 'shooting'],
  ['Space Creator', 'Você agora consegue criar mais espaço para seus arremessos.', 'Shooting', [25000, 48000, 78000], 'shooting'],
  ['Limitless Range', 'Está acertando seus arremessos cada vez mais longe.', 'Shooting', [42000, 72000, 102000], 'shooting'],
  ['Agent 3', 'Melhorou sua capacidade de fazer arremessos complexos na linha de 3 pontos.', 'Shooting', [50000, 90000, 130000], 'shooting'],
  ['Blinder', 'Qualquer interferência na sua visão não diminui sua precisão de arremesso.', 'Shooting', [40000, 70000, 110000], 'shooting'],
  ['Ankle Breaker', 'Seus dribles têm uma pequena chance de fazer o oponente tropeçar.', 'Ball Handle', [35000, 75000, 120000], 'ballhandle'],
  ['Footwork', 'Suas pernas trabalham melhor para contribuir com dribles de alto nível.', 'Ball Handle', [26000, 56000, 76000], 'ballhandle'],
  ['Blow Cross', 'Seus dribles, por mais simples que sejam, têm melhor explosividade.', 'Ball Handle', [30000, 62000, 94000], 'ballhandle'],
  ['Killer Combos', 'Seu arsenal de crossovers está muito diversificado.', 'Ball Handle', [40000, 62000, 84000], 'ballhandle'],
  ['Physical Handles', 'Mãos que manipulam a bola mesmo sob pressão defensiva.', 'Ball Handle', [37000, 77000, 107000], 'ballhandle'],
  ['Slithery', 'Você anda melhor pelo tráfego defensivo, desviando com eficácia.', 'Ball Handle', [29000, 68000, 97000], 'ballhandle'],
  ['Acrobat', 'Você consegue realizar bandejas de forma mais acrobática.', 'Finish', [26000, 61000, 95000], 'finish'],
  ['Bunny', 'Seus hop steps fazem saltos para a bandeja de forma mais eficaz.', 'Finish', [24000, 54000, 84000], 'finish'],
  ['Fast Twitch', 'Suas infiltrações para a cesta são mais velozes.', 'Finish', [35000, 75000, 120000], 'finish'],
  ['Fearless Finisher', 'Nas infiltrações, você absorve melhor o contato sem perder a destreza.', 'Finish', [29000, 68000, 97000], 'finish'],
  ['Float Game', 'Está se especializando em floaters nas infiltrações.', 'Finish', [22000, 44000, 66000], 'finish'],
  ['Two Step', 'Melhorou a capacidade de fazer euro-steps em suas infiltrações.', 'Finish', [28000, 58000, 88000], 'finish'],
  ['Anchor', 'Aumentou a habilidade de proteger o aro com bloqueios.', 'Defense', [25000, 48000, 78000], 'defense'],
  ['Ankle Braces', 'Você não tropeça facilmente ao defender os dribles dos oponentes.', 'Defense', [22000, 44000, 66000], 'defense'],
  ['Brick Wall', 'Você drena mais energia dos oponentes durante o contato físico.', 'Defense', [24000, 34000, 54000], 'defense'],
  ['Challenger', 'Você desafia os arremessadores com defesa de perímetro de alto nível.', 'Defense', [24000, 46000, 66000], 'defense'],
  ['Clamps', 'Sua defesa sabe lidar bem com ballhandlers de alto nível.', 'Defense', [25000, 48000, 78000], 'defense'],
  ['Glove', 'Desenvolveu excelente técnica para roubar bolas e causar turnovers.', 'Defense', [22000, 44000, 66000], 'defense'],
  ['Interceptor', 'Frequentemente consegue interceptar passes dos oponentes.', 'Defense', [24000, 34000, 54000], 'defense'],
  ['Breaker Starter', 'Após um rebote ou post-move, seus passes ficaram mais precisos.', 'Assist', [20000, 40000, 60000], 'fundamentals'],
  ['Dimer', 'Seus passes são mais efetivos quando seus parceiros ficam livres.', 'Assist', [20000, 40000, 60000], 'fundamentals'],
  ['Touch Passer', 'A velocidade dos seus passes agora é impressionante.', 'Assist', [24000, 34000, 54000], 'fundamentals'],
  ['Relay Passer', 'Você é a melhor opção para iniciar o ritmo de jogo com passes.', 'Assist', [19000, 32000, 45000], 'fundamentals'],
  ['Rebound Chaser', 'Melhorou sua habilidade em pegar rebotes em distâncias maiores.', 'Rebound', [20000, 40000, 60000], 'defense'],
  ['Boxout Beast', 'No box-out, você tem estabilidade maior sobre o oponente.', 'Rebound', [24000, 34000, 54000], 'defense'],
  ['Protector', 'Você protege o garrafão com rebotes de alto nível.', 'Rebound', [19000, 32000, 45000], 'defense'],
  ['Hook Specialist', 'Desenvolveu a técnica do hook shot a outro patamar.', 'Post-Move', [24000, 34000, 54000], 'finish'],
  ['Post Lockdown', 'Seus post-moves são eficientes contra oponentes mais fortes.', 'Post-Move', [25000, 48000, 78000], 'finish'],
  ['Spin Post', 'Seus post-moves com giro são mais velozes e estáveis.', 'Post-Move', [19000, 32000, 45000], 'finish'],
  ['Fast Feet', 'Suas pernas se movem mais rápido, no ataque ou na defesa.', 'Fitness', [35000, 75000, 120000], 'fitness'],
  ['Immovable Force', 'Sua força é maior, seja no contexto ofensivo ou defensivo.', 'Fitness', [28000, 68000, 118000], 'fitness'],
  ['Speed Booster', 'Sua velocidade aumentou nos mais diversos contextos em quadra.', 'Fitness', [25000, 48000, 78000], 'fitness'],
  ['Cycle Player', 'Sua resistência é maior em qualquer atividade ofensiva ou defensiva.', 'Fitness', [28000, 68000, 118000], 'fitness'],
];
export const MEDALS = M.map(([title, desc, type, tiers, src], i) => ({ id: i + 1, title, desc, type, tiers, src }));
export const TIERS = ['locked', 'bronze', 'silver', 'gold'];

export function medalProgress(profile, m) {
  const xp = m.src === 'total' ? profile.experience || 0 : (profile.xp_by_category || {})[m.src] || 0;
  return { xp, tier: m.tiers.filter((t) => xp >= t).length };
}
export function earnedMedals(profile) {
  return MEDALS.map((m) => ({ m, ...medalProgress(profile, m) }))
    .filter((x) => x.tier > 0)
    .sort((a, b) => b.tier - a.tier || b.xp - a.xp);
}

// ------------------------------------------------------------------
// Conteúdo inicial
// ------------------------------------------------------------------
export const SEED_CATEGORIES = [
  { slug: 'fundamentals', title: 'Fundamentals', sort: 1, description: 'A base de tudo: postura, passe, drible e arremesso. Todo Vagaroso começa por aqui.' },
  { slug: 'shooting', title: 'Shooting', sort: 2, description: 'Mecânica, média distância e bola de três. Treinos para pontuar sobre qualquer defesa.' },
  { slug: 'ballhandle', title: 'Ball Handle', sort: 3, description: 'Crossovers, combos e proteção de bola sob pressão defensiva.' },
  { slug: 'finish', title: 'Finish', sort: 4, description: 'Bandejas, floaters, euro-step e infiltrações para terminar a jogada na cesta.' },
  { slug: 'defense', title: 'Defense', sort: 5, description: 'Defesa de perímetro, roubos de bola, rebote e proteção do aro.' },
  { slug: 'fitness', title: 'Fitness', sort: 6, description: 'Velocidade, força e resistência para aguentar os quatro quartos.' },
];

const J = (id, category, title, difficulty, xpps, description, tip) => ({ id, category, title, difficulty, xpps, description, tip, media_url: null, sort: id });
export const SEED_JORNEYS = [
  J(1, 'fundamentals', 'Triple Threat', 'easy', 4, 'Receba a bola e assuma a posição de tripla ameaça: pés na largura dos ombros, joelhos flexionados, bola protegida no quadril. Repita 50 vezes alternando o pé de pivô.', 'Olhos sempre na cesta. Quem olha pra bola não vê o jogo.'),
  J(2, 'fundamentals', 'Chest & Bounce Pass', 'easy', 4, 'Em dupla ou contra a parede, 3 séries de 30 passes de peito e 30 quicados, mantendo distância de 4 metros.', 'O quique tem que acontecer a 2/3 da distância até o recebedor.'),
  J(3, 'fundamentals', 'Form Shooting', 'medium', 6, 'Arremessos a um metro do aro, só com a mão de arremesso. Suba a distância a cada 10 acertos.', 'Cotovelo alinhado com o joelho e follow-through até a bola tocar o aro.'),
  J(4, 'fundamentals', 'Defensive Slides', 'medium', 6, 'Deslocamento lateral de linha a linha do garrafão, 6 idas e voltas por série, 4 séries.', 'Não cruze os pés e mantenha o quadril baixo o tempo todo.'),
  J(5, 'shooting', 'Spot Up 5 Pontos', 'easy', 5, 'Arremessos de média distância em 5 pontos da quadra. 10 acertos em cada ponto antes de avançar.', 'Pés prontos antes da bola chegar.'),
  J(6, 'shooting', 'Pull Up Jumper', 'medium', 7, 'Dois dribles e arremesso parando no tempo certo, saindo para os dois lados.', 'Pare com os dois pés juntos, sem desequilibrar o corpo pra frente.'),
  J(7, 'shooting', 'Catch & Shoot 3PT', 'hard', 9, 'Recebe saindo do corta-luz e arremessa de três em menos de 1 segundo. 5 séries de 10.', 'Dobre os joelhos já na corrida; a força vem das pernas.'),
  J(8, 'shooting', 'Step Back', 'hard', 10, 'Drible de ataque, step back e arremesso. Alterne entre média distância e linha de três.', 'O passo pra trás cria o espaço; não precisa ser grande, precisa ser rápido.'),
  J(9, 'ballhandle', 'Pound Dribbles', 'easy', 4, 'Dribles fortes na altura da cintura, 30 segundos com cada mão, 5 séries.', 'Bata a bola com força: quanto mais rápido ela volta, menos tempo fica exposta.'),
  J(10, 'ballhandle', 'Crossover Series', 'medium', 6, 'Crossover baixo, between the legs e behind the back em sequência, de uma linha de fundo à outra.', 'Mude de velocidade, não só de direção.'),
  J(11, 'ballhandle', 'Killer Combos', 'hard', 9, 'Combos de 3 dribles sem olhar pra bola, com cones de obstáculo e finalização.', 'Treine devagar e certo antes de treinar rápido e errado.'),
  J(12, 'finish', 'Mikan Drill', 'easy', 5, 'Bandejas alternadas embaixo do aro, mão direita e esquerda, sem deixar a bola cair. 3 séries de 1 minuto.', 'Use a tabela. O quadrado foi pintado ali por um motivo.'),
  J(13, 'finish', 'Euro Step', 'medium', 7, 'Infiltração com euro-step contra um cone, finalizando dos dois lados.', 'O primeiro passo vende a ida; o segundo é que leva você à cesta.'),
  J(14, 'finish', 'Floater Game', 'hard', 8, 'Floaters de dentro do garrafão, saindo do drible, sobre um defensor imaginário alto.', 'Solte a bola no ponto mais alto do salto, com arco.'),
  J(15, 'defense', 'Closeout Drill', 'medium', 6, 'Corrida do garrafão até o arremessador, freando com passos curtos e mão alta.', 'Chegue em controle; closeout descontrolado é bandeja de graça.'),
  J(16, 'defense', 'Shell Rotation', 'hard', 8, 'Rotações defensivas 4x4 acompanhando a posição da bola.', 'Fale o tempo todo. Defesa boa é defesa barulhenta.'),
  J(17, 'fitness', 'Suicide Runs', 'medium', 7, 'Corridas de linha a linha (lance livre, meio, lance livre oposto, fundo). 6 repetições.', 'Toque a linha com a mão em cada virada.'),
  J(18, 'fitness', 'Vertical Jumps', 'hard', 9, 'Saltos verticais com aterrissagem controlada, 5 séries de 10, descanso de 1 minuto.', 'Aterrisse com os joelhos flexionados e alinhados com os pés.'),
];

export const DIFFICULTY = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
