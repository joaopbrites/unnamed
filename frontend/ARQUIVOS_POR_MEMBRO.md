# Separação de Arquivos por Membro — Frontend SDSC

> Arquivos a entregar para cada membro via canal externo.
> Todos os arquivos de **infraestrutura/base** devem ser incluídos nos dois pacotes.

---

## Arquivos de Infraestrutura (Base — ambos precisam)

```
frontend/
├── Dockerfile
├── package.json
├── svelte.config.js
├── vite.config.js          ← servidor de desenvolvimento (SvelteKit)
├── vitest.config.js        ← configuração de testes (Vitest)
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── app.html
│   ├── app.css
│   ├── setupTests.js
│   ├── __mocks__/
│   │   ├── app-environment.js
│   │   ├── app-navigation.js
│   │   └── app-stores.js
│   ├── lib/
│   │   ├── api.js                  ← cliente HTTP completo (inclui CRUD admin)
│   │   └── stores/
│   │       └── auth.js             ← store de autenticação
│   └── routes/
│       ├── +layout.js
│       ├── +layout.svelte
│       └── +page.svelte            ← home page
```

---

## MEMBRO 2 — Analytics, Eventos, Projetos, Busca, Perfil

### Páginas implementadas

| Rota | Arquivo |
|------|---------|
| `/events` | `src/routes/events/+page.svelte` |
| `/events/[id]` | `src/routes/events/[id]/+page.svelte` |
| `/projects` | `src/routes/projects/+page.svelte` |
| `/projects/[id]` | `src/routes/projects/[id]/+page.svelte` |
| `/search` | `src/routes/search/+page.svelte` |
| `/profile/[id]` | `src/routes/profile/[id]/+page.svelte` |
| `/analytics` | `src/routes/analytics/+page.svelte` |

### Componente

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/components/SearchBar.svelte` | Barra de busca reutilizável usada na Navbar |

### Testes

| Arquivo | Testes |
|---------|--------|
| `src/routes/events/events.test.js` | 8 testes — vagas, filtro, fila de espera |
| `src/routes/events/[id]/event-detail.test.js` | 16 testes — detalhe, inscrição confirmed/waitlisted, admin CRUD |
| `src/routes/projects/projects.test.js` | 7 testes — listagem, badges de status, filtro |
| `src/routes/projects/[id]/project-detail.test.js` | 13 testes — detalhe, datas, admin CRUD |
| `src/routes/search/search.test.js` | 6 testes — busca, resultados por tipo, query |
| `src/routes/profile/profile.test.js` | 7 testes — perfil, inscrições, comentários |
| `src/routes/analytics/analytics.test.js` | 7 testes — cards de totais, gráfico, período |
| `src/lib/api.test.js` | 9 testes (compartilhado) |
| `src/lib/stores/auth.test.js` | 9 testes (compartilhado) |

**Total Membro 2: 82 testes**

---

## MEMBRO 3 — Login, Cadastro, 2FA, Anúncios, Notificações, Comentários

### Páginas implementadas

| Rota | Arquivo |
|------|---------|
| `/login` | `src/routes/login/+page.svelte` |
| `/register` | `src/routes/register/+page.svelte` |
| `/2fa/setup` | `src/routes/2fa/setup/+page.svelte` |
| `/2fa/verify` | `src/routes/2fa/verify/+page.svelte` |
| `/announcements` | `src/routes/announcements/+page.svelte` |
| `/announcements/[id]` | `src/routes/announcements/[id]/+page.svelte` |

### Componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/components/Navbar.svelte` | Barra de navegação com busca, links e acesso ao sino |
| `src/lib/components/NotificationBell.svelte` | Sino com contador de não lidas e dropdown |
| `src/lib/components/Comment.svelte` | Comentário com like/dislike/reply/report |
| `src/lib/components/CommentSection.svelte` | Seção de comentários completa |

### Store

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/stores/notifications.js` | Store de notificações |

### Testes

| Arquivo | Testes |
|---------|--------|
| `src/routes/login/login.test.js` | 8 testes — login, erro, 2FA flow |
| `src/routes/register/register.test.js` | 6 testes — cadastro, validação, sucesso |
| `src/routes/2fa/setup/setup.test.js` | 9 testes — QR code, confirmação, erro |
| `src/routes/2fa/verify/verify.test.js` | 9 testes — verificação TOTP, redirect, edge cases |
| `src/routes/announcements/announcements.test.js` | 7 testes — listagem, fixados, categorias |
| `src/routes/announcements/[id]/announcement-detail.test.js` | 12 testes — detalhe, badge, admin CRUD |
| `src/lib/components/Comment.test.js` | 11 testes — like, dislike, report, replies |
| `src/lib/stores/notifications.test.js` | 9 testes — fetch, markRead, markAllRead |

**Total Membro 3: 71 testes**

---

## Resumo Final

| | Membro 2 | Membro 3 |
|--|---------|---------|
| Páginas | 7 | 6 |
| Componentes | 1 | 4 |
| Stores | — | 1 |
| Arquivos de teste | 9 | 8 |
| Total testes | 82 | 71 |

**Total geral frontend: 187 testes — todos passando ✅**
*(34 testes adicionais no módulo admin — João)*

---

## Como rodar os testes

```bash
cd frontend
npm install
npm test
```

## Como subir em desenvolvimento

```bash
# Opção 1 — Docker (recomendado, backend precisa estar rodando)
docker compose --profile frontend up --build

# Opção 2 — local
cd frontend
cp .env.example .env
npm run dev
# backend precisa estar em http://localhost:8000
```
