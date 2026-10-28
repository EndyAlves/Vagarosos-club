# Vagarosos Club

Rede do clube de basquete: feed de posts, jornadas de treino com XP, 41 medalhas, eventos com confirmação de presença, ranking, notificações e área de admin.

- **Front-end:** Vite + JavaScript, sem framework. Funciona no celular e pode ser instalado como app (PWA).
- **Banco e login:** Supabase (gratuito).
- **Hospedagem:** Vercel (gratuita).

Sem as variáveis do Supabase, o site roda em **modo demonstração**, com os dados salvos só no navegador. Serve para testar o visual antes de configurar o Supabase.

---

## Como colocar no ar (≈ 20 minutos)

### 1. Criar o banco no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**.
   - Região: **South America (São Paulo)**.
   - Guarde a senha do banco.
2. No menu lateral, abra o **SQL Editor**.
   - Clique em **New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   - Abra outra query, cole `supabase/seed.sql` e rode também. Ele cria as categorias, os 18 treinos e 3 eventos de exemplo.
3. Defina a **chave de membro**, que os novatos vão precisar para se cadastrar. No SQL Editor, rode:
   ```sql
   update private.settings set value = 'SUA-CHAVE-AQUI' where key = 'invite_key';
   ```
4. Desligue a confirmação por e-mail, porque o login do clube usa só username e senha:
   **Authentication → Sign In / Providers → Email** → desmarque **Confirm email** → **Save**.
5. Copie as credenciais em **Project Settings → API** (ou **Data API**):
   - **Project URL**, por exemplo `https://abcd1234.supabase.co`
   - **anon public key**, a chave pública. Nunca use a `service_role`.

### 2. Subir o código no GitHub

1. Crie um repositório novo em [github.com/new](https://github.com/new). Pode ser privado.
2. Envie os arquivos desta pasta, **menos** `node_modules` e `dist`.
   - Pela web: **Add file → Upload files** e arraste as pastas.
   - Pelo GitHub Desktop: escolha **Add local repository** apontando para esta pasta.

### 3. Publicar na Vercel

1. Entre em [vercel.com](https://vercel.com) com sua conta do GitHub.
2. Clique em **Add New → Project** e importe o repositório. O framework **Vite** é detectado sozinho.
3. Em **Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | a Project URL do passo 1.5 |
   | `VITE_SUPABASE_ANON_KEY` | a anon public key do passo 1.5 |

4. Clique em **Deploy**. Em cerca de 1 minuto o site está no ar, num endereço como `https://vagarosos-club.vercel.app`.

### 4. Virar admin

1. Abra o site, clique em **CADASTRAR** e crie sua conta usando a chave de membro.
2. No SQL Editor do Supabase, rode:
   ```sql
   update public.profiles set is_admin = true where username = 'seu_username';
   ```
3. Recarregue o site. Vai aparecer o menu **Admin**, onde você:
   - cria, edita e apaga treinos (inclusive com link de vídeo do YouTube);
   - gerencia categorias e eventos;
   - troca a chave de membro.

### 5. Domínio próprio (opcional)

1. Na Vercel, abra **Project → Settings → Domains** e adicione o seu domínio.
2. Adicione a variável `VITE_SITE_URL=https://seudominio.com.br` e faça um novo deploy. Ela deixa a prévia do link no WhatsApp com o endereço certo.
3. No Supabase, em **Authentication → URL Configuration**, coloque o mesmo endereço em **Site URL**.

---

## Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # preencha as duas variáveis (ou deixe sem, para o modo demo)
npm run dev                  # abre em http://localhost:5173
```

No modo demo, entre com **billy / vags123**. A chave de cadastro é **VAGS-2024**.

## O que tem de segurança

- **Senhas:** guardadas com criptografia pelo Supabase Auth.
- **Chave de membro:** conferida no servidor. Ninguém cria conta sem ela, nem chamando a API direto. A chave também não fica salva junto do usuário.
- **XP:** só sobe pelo servidor, durante o treino. É no máximo 1 ganho a cada 1,5 s e até 6.000 XP por dia, então ninguém consegue editar o próprio nível.
- **Permissões (RLS):** cada membro só apaga os próprios posts e comentários; o admin pode apagar qualquer um. Só admin cria treinos e eventos.
- **Spam:** limite de 5 posts e 20 comentários a cada 10 minutos por pessoa.
- **Imagens:** reduzidas no navegador antes do envio. Cada pessoa só envia para a própria pasta, com limite de 2 a 3 MB.
- **Cabeçalhos de segurança:** CSP, HSTS e proteção contra o site ser embutido em outro (veja `vercel.json`).

Para mudar o limite diário de XP, altere `daily_cap` na função `train_tick` em `supabase/schema.sql` e rode o arquivo de novo.

## Estrutura

```
index.html            página base com as tags de SEO e prévia de link
public/               imagens WebP, fontes WOFF2, ícones do app, og.png, sw.js
src/main.js           menu, rotas e layout (celular, tablet e desktop)
src/views/            telas: entrar, painel, jornadas, medalhas, eventos, ranking, perfil, admin
src/data/supabase.js  acesso ao Supabase
src/data/local.js     modo demonstração (localStorage)
src/data/content.js   posições, medalhas, fórmula de nível e conteúdo inicial
supabase/schema.sql   tabelas, permissões, gatilhos e funções
supabase/seed.sql     treinos, categorias e eventos de exemplo
```

## Observações

- **Projetos gratuitos do Supabase pausam** após 7 dias sem nenhum acesso. É só entrar no painel do Supabase e clicar em **Restore**.
- **Licença das fontes:** as fontes *PP Neue Machina* e *Sprite Graffiti* vieram do projeto original. Antes de usar o site de forma comercial, confira as licenças delas.
