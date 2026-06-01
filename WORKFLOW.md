# WORKFLOW.md — Guia de Desenvolvimento SDSC

> Este arquivo orienta o Claude Code e os membros do time.
> Regras aqui têm prioridade sobre preferências do momento — não as ignore.

---

## Regras Absolutas

1. **TDD obrigatório.** Nunca escreva código de produção sem um teste falhando antes.
2. **Nunca quebre testes existentes.** Antes de qualquer commit, rode a suíte completa.
3. **Migrations sempre após alterar models.** Nunca comite model sem migration correspondente.
4. **Sem lógica de negócio em views.** Lógica fica em models (métodos) ou em services separados se necessário.
5. **Sem comentários explicativos óbvios.** Só comente o "por quê" quando for não-óbvio.

---

## Fluxo TDD por Feature

```
Para cada feature nova:

1. RED   → escrever teste que falha
           - test_models.py: testa criação, validações, métodos do model
           - test_admin.py:  testa que o model aparece no admin
           - test_views.py:  testa endpoint (status code, permissões, payload)

2. GREEN → implementar o mínimo que faz o teste passar
           - Model primeiro, depois serializer, depois view

3. VERIFY → rodar suíte completa
            docker compose exec backend python manage.py test

4. COMMIT → só commitar com todos os testes passando
```

---

## Estrutura de Testes por App

Cada app deve ter:
```
apps/<nome>/tests/
├── __init__.py
├── test_models.py    # testa model, métodos, validações, __str__
├── test_admin.py     # testa registro no admin, listagem, search_fields
└── test_views.py     # testa cada endpoint: status, permissões, payload
```

### Padrão de test_views.py

```python
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

class NomeDaViewTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("admin", password="pass")
        self.member = User.objects.create_user("member", password="pass", is_member=True)
        self.visitor = User.objects.create_user("visitor", password="pass", is_member=False)

    # Sempre testar os 3 papéis: anonymous, member, admin
    def test_list_anonymous(self): ...
    def test_list_member(self): ...
    def test_list_admin(self): ...
    def test_create_requires_admin(self): ...
    def test_create_as_admin(self): ...
```

### Padrão de test_models.py

```python
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class ModelNameTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("user", password="pass")

    def test_str(self): ...
    def test_fields_defaults(self): ...
    def test_custom_method(self): ...
```

---

## Mapa de Features — Quem Faz O Quê

### João — Models, Admin, Signals, Infra

| Feature | Arquivos a criar/alterar |
|---|---|
| User: totp_secret, totp_enabled | `apps/accounts/models.py`, migration |
| Event: capacity | `apps/events/models.py`, migration |
| EventRegistration: status + choices | `apps/events/models.py`, migration |
| Comment: parent (self-FK), is_reported | `apps/comments/models.py`, migration |
| CommentReaction (novo model) | `apps/comments/models.py`, migration |
| App analytics + model PageView | `apps/analytics/` (criar app completo) |
| App notifications + model Notification | `apps/notifications/` (criar app completo) |
| Admin: CommentReaction, PageView, Notification | admins dos respectivos apps |
| Signals: Comment→Notif, Reaction→Notif, Registration→Notif | `apps/notifications/signals.py` |
| requirements.txt | `+ pyotp==2.9.0, qrcode[pil]==8.0, django-filter==24.3` |
| INSTALLED_APPS | `config/settings/base.py` |
| Testes models + admin | `test_models.py` e `test_admin.py` de cada app |

### Membro 2 — Views de Analytics, Events, Search, Profile

| Feature | Arquivos a criar/alterar |
|---|---|
| Analytics: summary + pageview history | `apps/analytics/views.py`, `urls.py` |
| Mixin RecordPageView | `apps/analytics/mixins.py` |
| Event registration com capacity/waitlist | `apps/events/views.py`, `serializers.py` |
| Filtros (django-filter) em events/projects | `apps/events/views.py`, `apps/projects/views.py` |
| User profile endpoint | `apps/accounts/views.py`, `serializers.py`, `urls.py` |
| Busca global | `apps/search/views.py` ou endpoint em `config/urls.py` |
| Testes views | `test_views.py` de cada app alterado |

### Membro 3 — Views de Comments, Notifications, 2FA

| Feature | Arquivos a criar/alterar |
|---|---|
| 2FA TOTP: setup, confirm, disable, verify | `apps/accounts/views.py`, `serializers.py`, `urls.py` |
| Comments: respostas (parent), react, report | `apps/comments/views.py`, `serializers.py`, `urls.py` |
| Notifications: list, read, read-all | `apps/notifications/views.py`, `serializers.py`, `urls.py` |
| Testes views | `test_views.py` de cada app alterado |

---

## Endpoints Novos — Referência Completa

```
# Analytics (admin only)
GET  /api/analytics/summary/
GET  /api/analytics/pageviews/?days=7

# Notifications
GET  /api/notifications/
PATCH /api/notifications/{id}/read/
POST /api/notifications/read-all/

# 2FA TOTP
POST /api/accounts/2fa/setup/       → retorna otpauth:// URI + secret
POST /api/accounts/2fa/confirm/     → body: {code} → ativa 2FA
POST /api/accounts/2fa/disable/     → body: {code} → desativa 2FA
POST /api/accounts/2fa/verify/      → body: {code} → valida código (pós-login)

# User profile
GET  /api/accounts/{id}/profile/

# Search
GET  /api/search/?q=texto

# Comments (expansão)
GET  /api/comments/{id}/replies/
POST /api/comments/{id}/react/      → body: {reaction_type: "like"|"dislike"}
POST /api/comments/{id}/report/

# Events (expansão)
# inscrição já existe, agora retorna status: confirmed | waitlisted
POST /api/events/{id}/register/
DELETE /api/events/{id}/unregister/ → promove waitlisted automaticamente
```

---

## Criando um Novo App Django

```bash
# 1. Criar a estrutura
docker compose exec backend python manage.py startapp <nome> apps/<nome>

# 2. Corrigir apps.py — o name deve ser "apps.<nome>"
# apps/<nome>/apps.py → name = "apps.<nome>"

# 3. Criar pasta de testes
mkdir apps/<nome>/tests
touch apps/<nome>/tests/__init__.py
touch apps/<nome>/tests/test_models.py
touch apps/<nome>/tests/test_admin.py
touch apps/<nome>/tests/test_views.py

# 4. Adicionar em INSTALLED_APPS (base.py)
# 5. Criar models.py → migration → admin.py → serializers.py → views.py → urls.py
# 6. Registrar urls em config/urls.py
```

---

## Ordem de Implementação

```
✅ Etapa 1 — Expansão de modelos existentes (João)
   User (TOTP) + Event (capacity) + EventRegistration (status)
   Comment (parent, is_reported) + CommentReaction
   190 testes passando

✅ Etapa 2 — Novos apps: analytics + notifications (João)
   PageView model + admin + RecordPageViewMixin
   Notification model + admin + 3 signals

✅ Etapa 3 — Views de comentários ricos
   GET  /api/comments/{id}/replies/
   POST /api/comments/{id}/react/
   POST /api/comments/{id}/report/

✅ Etapa 4 — Views de notificações + 2FA TOTP
   GET  /api/notifications/ + unread_count + mark_read + mark_all_read
   POST /api/accounts/2fa/setup|confirm|disable|verify/

✅ Etapa 5 — Analytics + eventos com fila + search + profile + filtros
   GET  /api/analytics/summary/
   GET  /api/analytics/pageviews/?days=7
   GET  /api/search/?q=texto
   GET  /api/accounts/{id}/profile/
   Filtros ?status= ?search= ?ordering= em events e projects

🔲 Etapa 6 — Frontend (Membros 2 e 3)
   Ver seção de divisão de trabalho no CLAUDE.md
```

---

## Checklist Antes de Cada Commit

- [ ] `docker compose exec backend python manage.py test` — zero falhas
- [ ] Migration gerada se houve alteração em models
- [ ] Nenhum `print()` ou `pdb` esquecido
- [ ] Testes cobrem os 3 papéis (anonymous, member, admin) para cada endpoint novo
