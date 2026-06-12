# CLAUDE.md — Sociedade Desportiva São Caetano

## Contexto do Projeto

Trabalho prático da disciplina **GAC116 - Programação Web (2026/1)**, valor 45 pontos, modalidade em grupo de 3 estudantes.

**Tema:** Site da associação de bairro *Sociedade Desportiva São Caetano*.

**Repositório GitHub:** `https://github.com/joaopbrites/unnamed`

---

## Status Atual (11/06/2026)

| Item | Status |
|------|--------|
| Checkpoint 1 (20 pts) | ✅ Entregue (21/05/2026) |
| Checkpoint 2 (25 pts) | ✅ Entregue (04/06/2026) |
| Docker +10% | ✅ |
| PostgreSQL +10% | ✅ |
| Deploy em produção +10% | ✅ |

### URLs de produção

| Serviço | URL |
|---------|-----|
| Frontend (GitHub Pages) | `https://joaopbrites.github.io/unnamed/` |
| Backend API (Render) | `https://unnamed-rzrx.onrender.com/api/` |
| Django Admin (Render) | `https://unnamed-rzrx.onrender.com/admin/` |

### Branches integradas em `main`
- `main` (João — backend completo + infra)
- `membro2-anderson` (Membro 2 — frontend events/projects)
- `integracao-membro-3` (Membro 3 — frontend announcements/login/register/2FA)

### Trabalho recente nesta sessão (11/06/2026)
Commits aplicados (mais recente primeiro):
- `fix:` CORS — adicionado `https://joaopbrites.github.io` ao default de `CORS_ALLOWED_ORIGINS` + `CORS_ALLOW_HEADERS` explícito (em `base.py`)
- `fix:` login não trava mais em "Entrando..." infinito — `api.js` agora trata falha de rede (try/catch em todos os `fetch`, retorna `{ ok: false, data: { detail } }`), `handleLogin` usa `try/finally`
- `fix:` `entrypoint.sh` com retry de conexão ao banco (30 tentativas) + migrate + collectstatic + `create_default_superuser` + gunicorn
- `feat:` `create_default_superuser` (management command) cria superusuário na inicialização via env vars `SUPERUSER_USERNAME/EMAIL/PASSWORD`
- `feat:` **gerenciamento de usuários via painel admin** (superuser only) — toggles de `is_member`/`is_staff`/`is_superuser`
- `feat:` redesign da home (hero com imagem, cards visuais, seção Sobre/Missão/Visão/Valores) + rodapé com contato fictício

> ⚠️ **ALERTA do usuário (11/06/2026):** "está todo quebrado desde quando subi o sistema".
>
> ✅ **DIAGNOSTICADO E CORRIGIDO (11/06/2026, parte 2):** A causa real **não** era o backend.
>
> - **Backend em produção está saudável:** `GET /events/` → 200; CORS preflight com `access-control-allow-origin: https://joaopbrites.github.io` correto; `POST /accounts/register/` → 201 (escrita ok). Banco de prod está **vazio** (0 eventos/projetos/anúncios), mas isso é dado, não quebra.
> - **A quebra real era o frontend no GitHub Pages:** o site estava em modo SPA puro (`+layout.js` com `prerender=false`), então **nenhum `index.html` era gerado** → a home respondia **HTTP 404**. Corrigido com `prerender=true` (gera `index.html` + páginas estáticas; rotas `[id]` caem no fallback `404.html`). Também faltava `static/favicon.svg` (referenciado em `app.html`), que quebrava o prerender — criado.
> - **Validado:** build de produção local agora gera `index.html` (200). Depois do push + redeploy do Action, a home deixa de dar 404.
>
> **App de teste E2E via web — FEITO:** página `/diagnostics` (harness em `frontend/src/lib/diagnostics.js`, testado em `diagnostics.test.js`) que roda ao vivo no navegador todas as funções da API e mostra ✅/❌/⏭️ por funcionalidade. Rodado contra produção real: 9 PASS (conectividade/leitura/auth/notificações), 14 SKIP (admin sem credenciais + ações em evento com banco vazio), 1 FAIL (home 404 — some após o deploy do fix de prerender). Acessível pelo painel `/admin` (card "Diagnóstico") ou direto pela URL.

---

## Pontos Extras (até 30% sobre a nota)

- [x] Docker containerization → +10%
- [x] PostgreSQL → +10%
- [x] Deploy em produção (GitHub Pages frontend + Render backend) → +10%

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 6.0.5 + Django REST Framework 3.16 |
| Banco de Dados | PostgreSQL 15 |
| Frontend | SvelteKit 2 + Svelte 5 |
| CSS | Tailwind CSS 3 |
| Infra local | Docker + Docker Compose |
| Deploy backend | Render (Docker, gunicorn + whitenoise) |
| Deploy frontend | GitHub Pages (adapter-static, base `/unnamed`) |
| Testes backend | Django TestCase |
| Testes frontend | Vitest + @testing-library/svelte |

---

## Funcionalidades Implementadas

### Módulos Principais
1. **Projetos** — listagem + detalhe + filtros por status/busca
2. **Eventos** — listagem + detalhe + inscrição com fila de espera (capacity)
3. **Anúncios** — listagem + detalhe + fixados primeiro
4. **Comentários** — GenericFK (events/projects/announcements) + reações like/dislike + denúncia + threads (replies)
5. **2FA TOTP** — setup/confirm/disable/verify via Google Authenticator
6. **Analytics** — pageviews + totais (somente admin)
7. **Notificações** — sino com contador (in-app)
8. **Busca global** — pesquisa em eventos, projetos e anúncios
9. **Perfil público** — inscrições e comentários recentes de qualquer membro
10. **Gerenciamento de usuários** (NOVO) — superuser altera `is_member`/`is_staff`/`is_superuser` de qualquer usuário via `/admin/users` (não pode editar a si mesmo)

### Regras de Acesso

| Ação | Visitante | Membro | Admin (staff) | Superuser |
|------|-----------|--------|-------|-----------|
| Ver projetos/eventos/anúncios | ✓ | ✓ | ✓ | ✓ |
| Comentar / reagir | ✗ | ✓ | ✓ | ✓ |
| Inscrever-se em evento | ✗ | ✓ | ✓ | ✓ |
| Criar/editar/excluir conteúdo | ✗ | ✗ | ✓ | ✓ |
| Gerenciar permissões de usuários | ✗ | ✗ | ✗ | ✓ |
| Django Admin | ✗ | ✗ | ✗ | ✓ |

---

## Divisão de Trabalho

### João (commita neste repo)
- Infra Docker (`docker-compose.yml`, `Dockerfile`s)
- Django base (`config/settings/`, `config/urls.py`)
- App `accounts` — User customizado + autenticação + 2FA TOTP
- **Todos os modelos** (events, projects, announcements, comments, analytics, notifications)
- **Todo o admin Django**
- Apps `analytics`, `notifications`, `search`
- Deploy (Render + GitHub Pages)

### Membro 2
- Views REST + Serializers de `events` e `projects`
- Frontend Svelte: páginas de Eventos e Projetos + busca + analytics + perfil

### Membro 3
- Views REST + Serializers de `announcements` e `comments`
- Frontend Svelte: Anúncios, Login, Cadastro, 2FA, Navbar, NotificationBell, CommentSection

---

## Padrão de Desenvolvimento

**TDD obrigatório:** escrever testes antes de implementar.

```
1. Escrever teste que falha (red)
2. Implementar código mínimo para passar (green)
3. Refatorar se necessário (refactor)
```

Comandos principais:
```bash
# Subir ambiente local
docker compose up --build

# Subir com frontend
docker compose --profile frontend up --build

# Testes backend
docker compose exec backend python manage.py test
# ou localmente:
cd backend && DJANGO_SETTINGS_MODULE=config.settings.base DATABASE_URL=sqlite:///test_db.sqlite3 SECRET_KEY=test python manage.py test

# Migrações
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Criar superusuário
docker compose exec backend python manage.py createsuperuser

# Testes frontend
cd frontend && npm test
```

---

## Estrutura de Diretórios

```
unnamed_git/
├── .github/workflows/deploy-frontend.yml   # CI/CD GitHub Pages
├── docker-compose.yml
├── backend/
│   ├── Dockerfile                          # CMD ["./entrypoint.sh"]
│   ├── entrypoint.sh                       # retry DB + migrate + collectstatic + superuser + gunicorn
│   ├── requirements.txt                    # inclui gunicorn, whitenoise, pyotp, django-filter
│   ├── manage.py
│   ├── config/
│   │   └── settings/
│   │       ├── base.py                     # django-filter, CORS, JWT, paginação
│   │       ├── development.py
│   │       └── production.py               # whitenoise, SECURE_PROXY_SSL_HEADER
│   └── apps/
│       ├── accounts/     # User + 2FA TOTP + gerenciamento de usuários (admin)
│       │   └── management/commands/create_default_superuser.py
│       ├── events/       # Event (capacity) + EventRegistration (status: confirmed/waitlisted)
│       ├── projects/     # Project
│       ├── announcements/# Announcement (category, is_pinned)
│       ├── comments/     # Comment (parent, is_reported) + CommentReaction (like/dislike)
│       ├── analytics/    # pageviews + resumo admin
│       ├── notifications/# notificações in-app + signals
│       └── search/       # busca global
└── frontend/
    ├── Dockerfile
    ├── svelte.config.js   # adapter-static, base: '/unnamed' em produção
    └── src/
        ├── lib/
        │   ├── api.js              # cliente HTTP (VITE_API_URL)
        │   ├── components/         # Navbar, NotificationBell, Comment, CommentSection, SearchBar
        │   └── stores/             # authStore, notificationsStore
        └── routes/
            ├── +page.svelte        # home
            ├── events/             # lista + detalhe
            ├── projects/           # lista + detalhe
            ├── announcements/      # lista + detalhe
            ├── search/
            ├── profile/[id]/
            ├── analytics/
            ├── login/
            ├── register/
            ├── 2fa/setup/ e 2fa/verify/
            └── admin/              # dashboard CRUD (admin only)
                └── users/          # gerenciar permissões (superuser only)
```

> **Mock de teste frontend:** `src/__mocks__/app-paths.js` exporta `base=''` e está registrado no alias do `vitest.config.js` (necessário porque os componentes importam `{ base } from '$app/paths'`).

---

## Modelos de Dados

- **User**: `is_member`, `bio`, `phone`, `totp_secret`, `totp_enabled`
- **Event**: título, descrição, data/hora, local, imagem, `capacity` (nullable), status, criado_por
- **EventRegistration**: user ↔ event, `status` (confirmed/waitlisted/cancelled), registered_at
- **Project**: título, descrição, start_date, end_date, status, imagem, criado_por
- **Announcement**: título, conteúdo, `category`, `is_pinned`, criado_por
- **Comment** (GenericFK): autor, content_type, object_id, `parent` (nullable), texto, `is_reported`
- **CommentReaction**: autor, comment, `reaction_type` (like/dislike) — unique_together

---

## Deploy

### Backend — Render
- Runtime: Docker (usa `backend/Dockerfile`)
- Root Directory: `backend`
- **Inicialização via `backend/entrypoint.sh`** (CMD do Dockerfile = `["./entrypoint.sh"]`):
  1. Aguarda banco ficar disponível (retry 30× / 2s usando psycopg2 + `urlparse(DATABASE_URL)`)
  2. `migrate --noinput`
  3. `collectstatic --noinput --clear`
  4. `create_default_superuser` (só cria se nenhum superuser existir)
  5. `exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2`
- Variáveis de ambiente no Render:
  - `DJANGO_SETTINGS_MODULE=config.settings.production`
  - `SECRET_KEY=<valor seguro>`
  - `DATABASE_URL=<URL do PostgreSQL Render>` ⚠️ Se backend e DB estiverem em **regiões diferentes** ou o hostname interno (`dpg-xxx-a`) não resolver DNS, usar a **External URL** (`...render.com`) em vez da Internal
  - `ALLOWED_HOSTS=unnamed-rzrx.onrender.com`
  - `CORS_ALLOWED_ORIGINS=https://joaopbrites.github.io` (sem barra final, `https`)
  - `DEBUG=False`
  - `SUPERUSER_USERNAME=admin` (NOVO)
  - `SUPERUSER_EMAIL=<email>` (NOVO)
  - `SUPERUSER_PASSWORD=<senha forte>` (NOVO — sem ela, o superuser não é criado)

> **Render free tier dorme após inatividade** — primeira requisição leva ~50s para acordar (cold start). Testes E2E em produção devem ter timeout generoso e idealmente um "wake-up ping" antes de começar.

### Frontend — GitHub Pages
- Workflow: `.github/workflows/deploy-frontend.yml` (dispara em push em `frontend/`)
- Base path: `/unnamed` (configurado em `svelte.config.js`)
- Variável no GitHub Actions (Settings → Variables):
  - `VITE_API_URL=https://unnamed-rzrx.onrender.com/api`
- **Todos os `href` e `goto` nos componentes usam `import { base } from '$app/paths'`**

---

## Variáveis de Ambiente (local)

Arquivo `.env` na raiz do projeto:
```
POSTGRES_DB=sdsc_db
POSTGRES_USER=sdsc_user
POSTGRES_PASSWORD=sdsc_password
DATABASE_URL=postgresql://sdsc_user:sdsc_password@db:5432/sdsc_db
SECRET_KEY=<gerar com: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## Pendências / Próximos Passos

- [x] Melhorar página inicial (hero com imagens, seção Sobre/Missão/Visão/Valores, rodapé com contato)
- [x] Criar superusuário no Render → resolvido com `create_default_superuser` + env vars (não precisa mais de terminal/`render run`, que não existe no free tier)
- [x] Gerenciar quem é superusuário via site → página `/admin/users`
- [x] **App de teste automatizado E2E via web** → página `/diagnostics` + harness testado (`lib/diagnostics.js`)
- [x] **Corrigir o 404 da home no GitHub Pages** → `prerender=true` no `+layout.js` (gera `index.html`) + `static/favicon.svg`. **Requer push do `frontend/` para o Action redeployar.**
- [x] Revisar variáveis de ambiente no Render (CORS, DATABASE_URL) → CORS confirmado OK em produção (preflight retorna a origem correta); backend saudável. O "quebrado" era o frontend, não o Render.
- [ ] Suporte a upload de imagens em eventos, projetos, anúncios e comentários (via media files)
- [ ] (Opcional) Popular o banco de produção com dados de demonstração (eventos/projetos/anúncios) — hoje está vazio

---

## Referência de API (para testes automatizados E2E)

**Base URL produção:** `https://unnamed-rzrx.onrender.com/api`
**Base URL local:** `http://localhost:8000/api`
**Cliente HTTP no frontend:** `frontend/src/lib/api.js` (objeto `api` com um método por endpoint).

### Autenticação (JWT — SimpleJWT)
| Método | Endpoint | Body | Resposta | Auth |
|--------|----------|------|----------|------|
| POST | `/token/` | `{username, password}` | `{access, refresh}` | público |
| POST | `/token/refresh/` | `{refresh}` | `{access}` | público |
| POST | `/accounts/register/` | `{username, email, password, first_name, last_name}` | user criado | público |
| GET | `/accounts/me/` | — | `{id, username, email, is_member, is_staff, is_superuser}` | Bearer |
| GET | `/accounts/<id>/profile/` | — | perfil público (sem email/totp_secret) | Bearer |

Header de autenticação: `Authorization: Bearer <access_token>`. Token expira → frontend tenta `/token/refresh/` automaticamente.

### Gerenciamento de usuários (superuser only)
| Método | Endpoint | Body | Notas |
|--------|----------|------|-------|
| GET | `/accounts/users/` | — | lista todos (sem paginação) |
| PATCH | `/accounts/users/<id>/` | `{is_member?, is_staff?, is_superuser?}` | só PATCH; 400 se editar a si mesmo |

### 2FA TOTP (auth)
| Método | Endpoint | Body |
|--------|----------|------|
| POST | `/accounts/2fa/setup/` | — → `{secret, otpauth_uri}` |
| POST | `/accounts/2fa/confirm/` | `{code}` |
| POST | `/accounts/2fa/disable/` | `{code}` |
| POST | `/accounts/2fa/verify/` | `{code}` |

### Eventos (ViewSet — DRF router)
| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/events/` `?status=upcoming/ongoing/past&search=&ordering=date` | público |
| GET | `/events/<id>/` | público |
| POST / PUT / DELETE | `/events/` , `/events/<id>/` | admin |
| POST | `/events/<id>/register/` | membro (inscreve; vira waitlisted se lotado) |
| DELETE | `/events/<id>/unregister/` | membro |

### Projetos / Anúncios (ViewSets)
- `/projects/` — GET lista `?status=planning/active/completed/cancelled&search=&ordering=-created_at`; GET/POST/PUT/DELETE `/projects/<id>/`
- `/announcements/` — GET lista (fixados primeiro via `is_pinned`); GET/POST/PUT/DELETE `/announcements/<id>/`

### Comentários (ViewSet)
| Método | Endpoint | Body |
|--------|----------|------|
| GET | `/comments/?content_type=<ct>&object_id=<id>` | — |
| POST | `/comments/` | `{content_type, object_id, text, parent?}` |
| GET | `/comments/<id>/replies/` | — |
| POST | `/comments/<id>/react/` | `{reaction_type: 'like'\|'dislike'}` |
| POST | `/comments/<id>/report/` | — |

### Notificações / Analytics / Busca
- `/notifications/` (GET lista), `/notifications/unread_count/`, `/notifications/<id>/mark_read/` (POST), `/notifications/mark_all_read/` (POST)
- `/analytics/summary/` (GET, admin), `/analytics/pageviews/?days=7` (GET, admin)
- `/search/?q=<termo>` (GET) — busca em eventos, projetos e anúncios

### Rotas do frontend (SvelteKit, base `/unnamed` em produção)
`/` (home) · `/events` · `/events/[id]` · `/projects` · `/projects/[id]` · `/announcements` · `/announcements/[id]` · `/search` · `/profile/[id]` · `/analytics` · `/login` · `/register` · `/2fa/setup` · `/2fa/verify` · `/admin` · `/admin/users` · `/admin/{events,projects,announcements}/new` · `/admin/{events,projects,announcements}/[id]/edit`

### Fluxo de login (E2E)
1. `POST /token/` com credenciais → guarda `access` + `refresh` no localStorage
2. `GET /accounts/me/` → se `totp_enabled`, pede código TOTP (`POST /2fa/verify/`); senão redireciona para `/`
3. `isAdmin` = `is_staff`; `isSuperuser` = `is_superuser` (stores derivados em `lib/stores/auth.js`)

### Pontos de atenção conhecidos (prováveis causas de "tudo quebrado" em produção)
- **CORS:** se a resposta de preflight `OPTIONS` não trouxer header `access-control-allow-origin`, a origem do GitHub Pages não está em `CORS_ALLOWED_ORIGINS` no Render. Testar: `curl -I -X OPTIONS -H "Origin: https://joaopbrites.github.io" -H "Access-Control-Request-Method: POST" <API>/token/`
- **Cold start:** Render free dorme; primeira chamada ~50s. Sintoma: "Não foi possível conectar ao servidor".
- **DATABASE_URL:** hostname interno (`dpg-xxx-a`) pode não resolver DNS → usar External URL.
- **`VITE_API_URL`** no GitHub Actions precisa ser `https://unnamed-rzrx.onrender.com/api` (sem barra final).
- O `api.js` agora **nunca lança exceção** em falha de rede (retorna `{ ok: false, data: { detail } }`) — testes devem checar `ok` em vez de `try/catch`.

### Credenciais de teste
- Superuser de produção: criado via env vars `SUPERUSER_USERNAME` / `SUPERUSER_PASSWORD` no Render (perguntar ao João os valores reais; não estão versionados).
