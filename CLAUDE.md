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

### Regras de Acesso

| Ação | Visitante | Membro | Admin |
|------|-----------|--------|-------|
| Ver projetos/eventos/anúncios | ✓ | ✓ | ✓ |
| Comentar / reagir | ✗ | ✓ | ✓ |
| Inscrever-se em evento | ✗ | ✓ | ✓ |
| Criar/editar/excluir conteúdo | ✗ | ✗ | ✓ |
| Django Admin | ✗ | ✗ | ✓ (superuser) |

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
│   ├── Dockerfile                          # gunicorn CMD incluído
│   ├── requirements.txt                    # inclui gunicorn, whitenoise, pyotp, django-filter
│   ├── manage.py
│   ├── config/
│   │   └── settings/
│   │       ├── base.py                     # django-filter, CORS, JWT, paginação
│   │       ├── development.py
│   │       └── production.py               # whitenoise, SECURE_PROXY_SSL_HEADER
│   └── apps/
│       ├── accounts/     # User + 2FA TOTP (totp_secret, totp_enabled)
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
```

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
- Variáveis de ambiente no Render:
  - `DJANGO_SETTINGS_MODULE=config.settings.production`
  - `SECRET_KEY=<valor seguro>`
  - `DATABASE_URL=<Internal URL do PostgreSQL Render>`
  - `ALLOWED_HOSTS=unnamed-rzrx.onrender.com`
  - `CORS_ALLOWED_ORIGINS=https://joaopbrites.github.io`
  - `DEBUG=False`

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

- [ ] Suporte a upload de imagens em eventos, projetos, anúncios e comentários (via media files)
- [ ] Melhorar página inicial (hero com imagens, banco de imagens gratuitas: Unsplash/Pexels)
- [ ] Criar superusuário no Render: `render run python manage.py createsuperuser`
