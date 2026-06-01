# Sociedade Desportiva São Caetano

Site da associação de bairro **Sociedade Desportiva São Caetano**, desenvolvido como trabalho prático da disciplina GAC116 - Programação Web (2026/1).

## Funcionalidades

- **Projetos** — visualize os projetos em andamento na associação
- **Eventos** — confira e inscreva-se em eventos do bairro (vagas limitadas com fila de espera)
- **Anúncios** — quadro de avisos e notas da associação
- **Comentários** — membros cadastrados podem comentar, reagir (like/dislike) e responder em threads
- **Notificações** — sino com contador de não lidas; alertas automáticos por comentário, reação e inscrição
- **Busca global** — pesquise eventos, projetos e anúncios em uma só tela
- **Perfil de usuário** — veja inscrições e comentários recentes de qualquer membro
- **2FA TOTP** — autenticação em dois fatores opcional (Google Authenticator / Authy)
- **Analytics** — gráficos de pageviews e totais (somente admin)
- **Área administrativa** — dashboard com criação, edição e exclusão de eventos, projetos e anúncios

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 6 + Django REST Framework |
| Banco de Dados | PostgreSQL 15 |
| Frontend | SvelteKit 2 + Svelte 5 |
| CSS | Tailwind CSS 3 |
| Infra | Docker + Docker Compose |
| Testes backend | Django TestCase (190 testes) |
| Testes frontend | Vitest + @testing-library/svelte (187 testes) |

## Como rodar

### Pré-requisitos
- Docker e Docker Compose instalados

### 1. Clone o repositório
```bash
git clone <url-do-repo>
cd unnamed_git
```

### 2. Configure as variáveis de ambiente
```bash
cp frontend/.env.example frontend/.env
# Edite .env e defina um SECRET_KEY seguro
```

O arquivo `.env` deve ficar na raiz do projeto com o seguinte conteúdo:

```env
POSTGRES_DB=sdsc_db
POSTGRES_USER=sdsc_user
POSTGRES_PASSWORD=sdsc_password
DATABASE_URL=postgresql://sdsc_user:sdsc_password@db:5432/sdsc_db
SECRET_KEY=<gerar com: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Suba o ambiente

```bash
# Apenas backend + banco (padrão)
docker compose up --build

# Backend + banco + frontend
docker compose --profile frontend up --build
```

### 4. Execute as migrações e crie um superusuário

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

### 5. Acesse

| Serviço | URL |
| ------- | --- |
| Frontend | <http://localhost:5173/> |
| API REST | <http://localhost:8000/api/> |
| Django Admin | <http://localhost:8000/admin/> |

## Rodando testes

### Backend

```bash
# Com Docker
docker compose exec backend python manage.py test

# Localmente (requer venv com dependências instaladas)
cd backend
DJANGO_SETTINGS_MODULE=config.settings.base \
  DATABASE_URL=sqlite:///test_db.sqlite3 \
  SECRET_KEY=test \
  python manage.py test
```

### Frontend

```bash
cd frontend
npm install
npm test          # roda uma vez (CI)
npm run test:watch  # modo watch
```

## Estrutura do projeto

```
unnamed_git/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   └── settings/         # base.py, development.py, production.py
│   └── apps/
│       ├── accounts/         # usuários, 2FA TOTP, perfil
│       ├── events/           # eventos + capacidade/fila de espera
│       ├── projects/         # projetos + filtros
│       ├── announcements/    # anúncios
│       ├── comments/         # comentários + reações + denúncia
│       ├── analytics/        # pageviews + resumo (admin only)
│       ├── notifications/    # notificações in-app + signals
│       └── search/           # busca global
└── frontend/
    ├── Dockerfile
    └── src/
        ├── lib/
        │   ├── api.js              # cliente HTTP centralizado
        │   ├── components/         # Navbar, NotificationBell, Comment, CommentSection, SearchBar
        │   └── stores/             # authStore, notificationsStore
        └── routes/
            ├── events/             # lista + detalhe com inscrição/fila
            ├── projects/           # lista + detalhe
            ├── announcements/      # lista + detalhe
            ├── search/             # busca global
            ├── profile/[id]/       # perfil público
            ├── analytics/          # gráficos admin only
            ├── login/              # login com fluxo 2FA embutido
            ├── register/           # cadastro
            ├── 2fa/                # setup e verificação TOTP
            └── admin/              # dashboard + CRUD (admin only)
```

## Integrantes

| Nome | GitHub |
|------|--------|
| João Pedro Brites | [@joaopbrites](https://github.com/joaopbrites) |
| Membro 2 | — |
| Membro 3 | — |
