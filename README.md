# Sociedade Desportiva São Caetano

Site da associação de bairro **Sociedade Desportiva São Caetano**, desenvolvido como trabalho prático da disciplina GAC116 - Programação Web (2026/1).

## Funcionalidades

- **Projetos** — visualize os projetos em andamento na associação
- **Eventos** — confira e inscreva-se em eventos do bairro
- **Anúncios** — quadro de avisos e notas da associação
- **Comentários** — membros cadastrados podem comentar em qualquer conteúdo
- **Área administrativa** — Django Admin para gestão completa

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 6 + Django REST Framework |
| Banco de Dados | PostgreSQL 15 |
| Frontend | Svelte (SvelteKit) |
| CSS | Tailwind CSS |
| Infra | Docker + Docker Compose |

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
cp .env.example .env
# Edite .env e defina um SECRET_KEY seguro
```

### 3. Suba o ambiente
```bash
docker compose up --build
```

### 4. Crie um superusuário (admin)
```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Acesse
- **Django Admin:** http://localhost:8000/admin/
- **API:** http://localhost:8000/api/
- **Frontend:** http://localhost:5173/ *(requer `docker compose --profile frontend up`)*

## Rodando testes

```bash
# Com Docker
docker compose exec backend python manage.py test

# Com virtualenv local
cd backend
python manage.py test
```

## Estrutura do projeto

```
unnamed_git/
├── docker-compose.yml
├── backend/
│   ├── apps/
│   │   ├── accounts/     # usuários e autenticação
│   │   ├── events/       # eventos e inscrições
│   │   ├── projects/     # projetos da associação
│   │   ├── announcements/# anúncios e avisos
│   │   └── comments/     # comentários genéricos
│   └── config/           # settings, urls, wsgi
└── frontend/             # SvelteKit (Checkpoint 2)
```

## Integrantes

| Nome | GitHub |
|------|--------|
| João Pedro Brites | [@joaopbrites](https://github.com/joaopbrites) |
| Membro 2 | — |
| Membro 3 | — |
