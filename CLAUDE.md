# CLAUDE.md — Sociedade Desportiva São Caetano

## Contexto do Projeto

Trabalho prático da disciplina **GAC116 - Programação Web (2026/1)**, valor 45 pontos, modalidade em grupo de 3 estudantes.

**Tema:** Site da associação de bairro *Sociedade Desportiva São Caetano*.

**Repositório:** público no GitHub; todos os membros devem aparecer como contribuidores com ao menos um commit.

---

## Prazos Críticos

| Data | Evento | Requisito |
|------|--------|-----------|
| 21/05/2026 | **Checkpoint 1** (20 pts) | Modelagem completa + ambiente administrativo |
| 21/05/2026 | Link GitHub no Campus Virtual até 23:55 | — |
| 04/06/2026 | **Checkpoint 2** (25 pts) | Projeto completo |

---

## Pontos Extras (até 30% sobre a nota)

- [x] Docker containerization → +10%
- [x] PostgreSQL → +10%
- [ ] Deploy em produção (GitHub Pages para frontend) → +10%

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 6+ com Django REST Framework |
| Banco de Dados | PostgreSQL 15 |
| Frontend | Svelte (SvelteKit) |
| CSS | Tailwind CSS |
| Infra | Docker + Docker Compose |
| Deploy frontend | GitHub Pages (build estático do SvelteKit) |

---

## Funcionalidades do Site

### Módulos Principais

1. **Projetos** — visualização de projetos em atividade na associação
2. **Eventos** — eventos que acontecerão no bairro; usuários externos podem se inscrever
3. **Anúncios** — quadro de avisos/notas do bairro

### Regras de Acesso

| Ação | Visitante | Membro Cadastrado | Admin |
|------|-----------|-------------------|-------|
| Ver projetos/eventos/anúncios | ✓ | ✓ | ✓ |
| Comentar em qualquer conteúdo | ✗ | ✓ | ✓ |
| Inscrever-se em evento | ✗ | ✓ | ✓ |
| Criar/editar/excluir conteúdo | ✗ | ✗ | ✓ |
| Acesso ao Django Admin | ✗ | ✗ | ✓ (superuser) |

---

## Divisão de Trabalho (3 membros)

> O repositório Git reflete commits de todos os membros. Arquivos de outros membros são compartilhados por canal externo (ver `team_files.md` — gitignored).

### João (você — commita neste repo)
- Infraestrutura Docker (`docker-compose.yml`, `Dockerfile`s)
- Projeto Django base (`config/settings/`, `config/urls.py`)
- App `accounts` — modelo de usuário customizado + autenticação
- **Modelos** de todos os apps (events, projects, announcements, comments)
- **Admin** de todos os apps (Django Admin)
- Testes de models e admin

### Membro 2 (recebe arquivos via canal externo)
- Views REST + Serializers de `events` e `projects`
- URLs de `events` e `projects`
- Frontend Svelte: página de Eventos e página de Projetos

### Membro 3 (recebe arquivos via canal externo)
- Views REST + Serializers de `announcements` e `comments`
- URLs de `announcements` e `comments`
- Frontend Svelte: página de Anúncios, cadastro e login de usuário, home

---

## Padrão de Desenvolvimento

**TDD obrigatório:** escrever testes antes de implementar. Nunca refatorar por não ter testado antes.

```
1. Escrever teste que falha (red)
2. Implementar código mínimo para passar (green)
3. Refatorar se necessário (refactor)
```

Comandos principais:
```bash
# Rodar testes (dentro do container ou com venv ativo)
cd backend && python manage.py test

# Subir ambiente
docker compose up --build

# Migrações
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Criar superusuário
docker compose exec backend python manage.py createsuperuser
```

---

## Estrutura de Diretórios

```
unnamed_git/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/               # settings, urls, wsgi
│   │   └── settings/
│   │       ├── base.py
│   │       ├── development.py
│   │       └── production.py
│   └── apps/
│       ├── accounts/         # usuários (João)
│       ├── events/           # eventos (modelos: João / views: Membro 2)
│       ├── projects/         # projetos (modelos: João / views: Membro 2)
│       ├── announcements/    # anúncios (modelos: João / views: Membro 3)
│       └── comments/         # comentários genéricos (modelos: João / views: Membro 3)
├── frontend/                 # SvelteKit (Checkpoint 2)
│   ├── Dockerfile
│   └── src/
└── README.md
```

---

## Modelos de Dados (resumo)

- **User** (custom AbstractUser): `is_member`, papel definido por grupo Django
- **Event**: título, descrição, data/hora, local, imagem, status, criado_por
- **EventRegistration**: user ↔ event (M2M com dados extras)
- **Project**: título, descrição, datas, status, imagem, criado_por
- **Announcement**: título, conteúdo, categoria, fixado, criado_por
- **Comment** (GenericFK): autor, content_type, object_id, texto, data

---

## Variáveis de Ambiente

Arquivo `.env` (gitignored) na raiz do projeto:
```
POSTGRES_DB=sdsc_db
POSTGRES_USER=sdsc_user
POSTGRES_PASSWORD=sdsc_password
DATABASE_URL=postgresql://sdsc_user:sdsc_password@db:5432/sdsc_db
SECRET_KEY=<gerar com python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=True
```