// Harness de diagnóstico E2E "via web".
// Exercita TODAS as funções da API (em produção ou local) na ordem real de uso,
// reportando passou/falhou/pulado por funcionalidade. É independente do api.js
// (mantém tokens em memória, NÃO mexe no localStorage / na sessão do usuário),
// para poder testar múltiplas identidades (anônimo, membro descartável, admin)
// numa única execução sem derrubar quem estiver logado.
//
// Toda a lógica recebe `fetch` por injeção → testável com Vitest (ver diagnostics.test.js).

// Usuário membro descartável reutilizado entre execuções (evita poluir o banco com
// um novo usuário a cada rodada). Conta sem privilégios — credenciais públicas de propósito.
export const DIAG_USER = {
  username: 'diagnostics_probe',
  email: 'diagnostics_probe@sdsc.test',
  password: 'Diag-Probe-2026!',
  first_name: 'Diag',
  last_name: 'Probe',
};

export class SkipError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SkipError';
    this.skip = true;
  }
}

export function skip(reason) {
  throw new SkipError(reason);
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function now() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

// Cliente HTTP mínimo: token por chamada, timeout via AbortController, sem exceções
// (falha de rede vira { status: 0, networkError: true }).
export function createHttp(baseUrl, fetchImpl) {
  return async function http(method, path, { token, body, timeoutMs = 20000 } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    let res;
    try {
      res = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller ? controller.signal : undefined,
      });
    } catch {
      if (timer) clearTimeout(timer);
      return { status: 0, ok: false, data: null, networkError: true };
    }
    if (timer) clearTimeout(timer);

    let data = null;
    const text = await res.text().catch(() => '');
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { status: res.status, ok: res.ok, data };
  };
}

// Lista declarativa de verificações, na ordem de dependência:
// conectividade → leitura pública → autenticação → admin (cria dados) →
// ações de membro (usam os dados) → superuser → limpeza → frontend.
export function buildChecks() {
  return [
    // ── Conectividade ────────────────────────────────────────────────
    {
      group: 'Conectividade',
      id: 'wake',
      label: 'Backend acordado (GET /events/)',
      async run(ctx) {
        const r = await ctx.http('GET', '/events/', { timeoutMs: 90000 });
        if (r.networkError) {
          throw new Error('Sem resposta — cold start (~50s do Render free), offline ou CORS bloqueado.');
        }
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        assert(r.data && Array.isArray(r.data.results), 'Resposta sem results[]');
        if (r.data.results.length && ctx.state.eventId == null) {
          ctx.state.eventId = r.data.results[0].id;
        }
        return `200 · ${r.data.count} evento(s) no banco`;
      },
    },

    // ── Leitura pública ──────────────────────────────────────────────
    {
      group: 'Leitura pública',
      id: 'projects',
      label: 'Listar projetos',
      async run(ctx) {
        const r = await ctx.http('GET', '/projects/');
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        assert(r.data && Array.isArray(r.data.results), 'Sem results[]');
        return `200 · ${r.data.count} projeto(s)`;
      },
    },
    {
      group: 'Leitura pública',
      id: 'announcements',
      label: 'Listar anúncios',
      async run(ctx) {
        const r = await ctx.http('GET', '/announcements/');
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        const n = r.data?.count ?? (Array.isArray(r.data) ? r.data.length : '?');
        return `200 · ${n} anúncio(s)`;
      },
    },
    {
      group: 'Leitura pública',
      id: 'search',
      label: 'Busca global (?q=a)',
      async run(ctx) {
        const r = await ctx.http('GET', '/search/?q=a');
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        return '200 OK';
      },
    },

    // ── Autenticação ─────────────────────────────────────────────────
    {
      group: 'Autenticação',
      id: 'register',
      label: 'Registrar usuário de teste',
      async run(ctx) {
        const r = await ctx.http('POST', '/accounts/register/', { body: DIAG_USER });
        if (r.status === 201) return 'usuário criado (201)';
        if (r.status === 400) return 'já existia — ok (400)';
        throw new Error(`Esperado 201 ou 400, veio ${r.status}`);
      },
    },
    {
      group: 'Autenticação',
      id: 'login',
      label: 'Login JWT (POST /token/)',
      async run(ctx) {
        const r = await ctx.http('POST', '/token/', {
          body: { username: DIAG_USER.username, password: DIAG_USER.password },
        });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        assert(r.data && r.data.access && r.data.refresh, 'Sem access/refresh na resposta');
        ctx.state.memberToken = r.data.access;
        ctx.state.memberRefresh = r.data.refresh;
        return 'access + refresh recebidos';
      },
    },
    {
      group: 'Autenticação',
      id: 'me',
      label: 'GET /accounts/me/',
      async run(ctx) {
        if (!ctx.state.memberToken) skip('login não passou');
        const r = await ctx.http('GET', '/accounts/me/', { token: ctx.state.memberToken });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        assert(r.data.username === DIAG_USER.username, 'username não confere com o token');
        assert(r.data.is_member === true, 'usuário deveria ser membro (is_member=true)');
        return `${r.data.username} · membro=${r.data.is_member}`;
      },
    },
    {
      group: 'Autenticação',
      id: 'refresh',
      label: 'Refresh de token',
      async run(ctx) {
        if (!ctx.state.memberRefresh) skip('login não passou');
        const r = await ctx.http('POST', '/token/refresh/', { body: { refresh: ctx.state.memberRefresh } });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        assert(r.data.access, 'Sem novo access');
        return 'novo access recebido';
      },
    },

    // ── Admin (opcional: precisa de credenciais) ─────────────────────
    {
      group: 'Admin',
      id: 'adminLogin',
      label: 'Login admin',
      async run(ctx) {
        if (!ctx.creds.adminUsername || !ctx.creds.adminPassword) {
          skip('sem credenciais de admin (preencha para rodar os testes de admin)');
        }
        const r = await ctx.http('POST', '/token/', {
          body: { username: ctx.creds.adminUsername, password: ctx.creds.adminPassword },
        });
        assert(r.status === 200, `Login admin falhou (${r.status})`);
        ctx.state.adminToken = r.data.access;
        const me = await ctx.http('GET', '/accounts/me/', { token: ctx.state.adminToken });
        assert(me.status === 200, 'GET /me/ do admin falhou');
        ctx.state.isAdmin = !!me.data.is_staff;
        ctx.state.isSuperuser = !!me.data.is_superuser;
        assert(ctx.state.isAdmin, 'o usuário informado não é staff/admin');
        return `${me.data.username} · staff=${me.data.is_staff} · superuser=${me.data.is_superuser}`;
      },
    },
    {
      group: 'Admin',
      id: 'createEvent',
      label: 'Criar evento (POST /events/)',
      async run(ctx) {
        if (!ctx.state.adminToken) skip('sem login de admin');
        const body = {
          title: `[DIAG] Evento ${Date.now()}`,
          description: 'Evento temporário criado pelo diagnóstico. Será removido ao final.',
          date: new Date(Date.now() + 7 * 864e5).toISOString(),
          location: 'Sede da SDSC',
          status: 'upcoming',
          capacity: 10,
        };
        const r = await ctx.http('POST', '/events/', { token: ctx.state.adminToken, body });
        assert(r.status === 201, `Esperado 201, veio ${r.status} · ${JSON.stringify(r.data)}`);
        ctx.state.createdEventId = r.data.id;
        ctx.state.eventId = r.data.id; // membro passa a usar o evento de teste
        return `evento #${r.data.id} criado`;
      },
    },
    {
      group: 'Admin',
      id: 'editEvent',
      label: 'Editar evento (PUT)',
      async run(ctx) {
        if (!ctx.state.createdEventId) skip('nenhum evento de teste criado');
        const body = {
          title: '[DIAG] Evento editado',
          description: 'Descrição atualizada pelo diagnóstico.',
          date: new Date(Date.now() + 8 * 864e5).toISOString(),
          location: 'Quadra poliesportiva',
          status: 'ongoing',
          capacity: 20,
        };
        const r = await ctx.http('PUT', `/events/${ctx.state.createdEventId}/`, {
          token: ctx.state.adminToken,
          body,
        });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        return 'evento atualizado';
      },
    },
    {
      group: 'Admin',
      id: 'project',
      label: 'Criar e excluir projeto',
      async run(ctx) {
        if (!ctx.state.adminToken) skip('sem login de admin');
        const c = await ctx.http('POST', '/projects/', {
          token: ctx.state.adminToken,
          body: {
            title: '[DIAG] Projeto temporário',
            description: 'Criado pelo diagnóstico.',
            start_date: new Date().toISOString().slice(0, 10),
            status: 'active',
          },
        });
        assert(c.status === 201, `criar: esperado 201, veio ${c.status} · ${JSON.stringify(c.data)}`);
        const d = await ctx.http('DELETE', `/projects/${c.data.id}/`, { token: ctx.state.adminToken });
        assert(d.status === 204, `excluir: esperado 204, veio ${d.status}`);
        return 'criado e excluído';
      },
    },
    {
      group: 'Admin',
      id: 'announcement',
      label: 'Criar e excluir anúncio',
      async run(ctx) {
        if (!ctx.state.adminToken) skip('sem login de admin');
        const c = await ctx.http('POST', '/announcements/', {
          token: ctx.state.adminToken,
          body: {
            title: '[DIAG] Anúncio temporário',
            content: 'Criado pelo diagnóstico.',
            category: 'general',
            is_pinned: false,
          },
        });
        assert(c.status === 201, `criar: esperado 201, veio ${c.status} · ${JSON.stringify(c.data)}`);
        const d = await ctx.http('DELETE', `/announcements/${c.data.id}/`, { token: ctx.state.adminToken });
        assert(d.status === 204, `excluir: esperado 204, veio ${d.status}`);
        return 'criado e excluído';
      },
    },
    {
      group: 'Admin',
      id: 'analytics',
      label: 'Analytics summary (admin)',
      async run(ctx) {
        if (!ctx.state.adminToken) skip('sem login de admin');
        const r = await ctx.http('GET', '/analytics/summary/', { token: ctx.state.adminToken });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        return '200 OK';
      },
    },

    // ── Ações de membro (usam um evento existente ou o de teste) ──────
    {
      group: 'Ações de membro',
      id: 'registerEvent',
      label: 'Inscrever-se em evento',
      async run(ctx) {
        if (!ctx.state.memberToken) skip('sem login de membro');
        if (ctx.state.eventId == null) skip('nenhum evento disponível (informe um admin p/ criar)');
        const r = await ctx.http('POST', `/events/${ctx.state.eventId}/register/`, {
          token: ctx.state.memberToken,
        });
        if (r.status === 201) {
          ctx.state.memberRegistered = true;
          return `inscrito (${r.data.status})`;
        }
        if (r.status === 400) {
          ctx.state.memberRegistered = true; // já inscrito de uma rodada anterior
          return 'já estava inscrito — ok';
        }
        throw new Error(`Esperado 201 ou 400, veio ${r.status}`);
      },
    },
    {
      group: 'Ações de membro',
      id: 'comment',
      label: 'Comentar em evento',
      async run(ctx) {
        if (!ctx.state.memberToken) skip('sem login de membro');
        if (ctx.state.eventId == null) skip('nenhum evento disponível');
        const r = await ctx.http('POST', '/comments/', {
          token: ctx.state.memberToken,
          body: {
            content_type: 'events.event',
            object_id: ctx.state.eventId,
            text: '[DIAG] comentário de teste',
          },
        });
        assert(r.status === 201, `Esperado 201, veio ${r.status} · ${JSON.stringify(r.data)}`);
        ctx.state.commentId = r.data.id;
        return `comentário #${r.data.id}`;
      },
    },
    {
      group: 'Ações de membro',
      id: 'listComments',
      label: 'Listar comentários do evento',
      async run(ctx) {
        if (ctx.state.eventId == null) skip('nenhum evento disponível');
        const r = await ctx.http(
          'GET',
          `/comments/?content_type=events.event&object_id=${ctx.state.eventId}`,
          { token: ctx.state.memberToken },
        );
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        const list = r.data.results ?? r.data;
        assert(Array.isArray(list), 'resposta não é uma lista');
        return `${list.length} comentário(s)`;
      },
    },
    {
      group: 'Ações de membro',
      id: 'react',
      label: 'Reagir a comentário (like)',
      async run(ctx) {
        if (!ctx.state.commentId) skip('nenhum comentário criado');
        const r = await ctx.http('POST', `/comments/${ctx.state.commentId}/react/`, {
          token: ctx.state.memberToken,
          body: { reaction_type: 'like' },
        });
        assert(r.status === 200 || r.status === 201, `Esperado 200/201, veio ${r.status}`);
        return r.data?.detail || 'reação registrada';
      },
    },
    {
      group: 'Ações de membro',
      id: 'notifications',
      label: 'Notificações (lista + contador)',
      async run(ctx) {
        if (!ctx.state.memberToken) skip('sem login de membro');
        const a = await ctx.http('GET', '/notifications/', { token: ctx.state.memberToken });
        assert(a.status === 200, `lista: esperado 200, veio ${a.status}`);
        const b = await ctx.http('GET', '/notifications/unread_count/', { token: ctx.state.memberToken });
        assert(b.status === 200, `contador: esperado 200, veio ${b.status}`);
        return `não lidas: ${b.data?.unread_count ?? b.data?.count ?? 0}`;
      },
    },
    {
      group: 'Ações de membro',
      id: 'unregisterEvent',
      label: 'Cancelar inscrição (limpeza)',
      async run(ctx) {
        if (!ctx.state.memberRegistered) skip('não estava inscrito');
        const r = await ctx.http('DELETE', `/events/${ctx.state.eventId}/unregister/`, {
          token: ctx.state.memberToken,
        });
        assert(r.status === 204, `Esperado 204, veio ${r.status}`);
        return 'inscrição cancelada';
      },
    },
    {
      group: 'Ações de membro',
      id: 'deleteComment',
      label: 'Excluir comentário (limpeza)',
      async run(ctx) {
        if (!ctx.state.commentId) skip('nenhum comentário criado');
        const r = await ctx.http('DELETE', `/comments/${ctx.state.commentId}/`, {
          token: ctx.state.memberToken,
        });
        assert(r.status === 204, `Esperado 204, veio ${r.status}`);
        return 'comentário excluído';
      },
    },

    // ── Superuser (opcional) ─────────────────────────────────────────
    {
      group: 'Superuser',
      id: 'listUsers',
      label: 'Listar usuários (superuser)',
      async run(ctx) {
        if (!ctx.state.adminToken) skip('sem login de admin');
        if (!ctx.state.isSuperuser) skip('o admin informado não é superusuário');
        const r = await ctx.http('GET', '/accounts/users/', { token: ctx.state.adminToken });
        assert(r.status === 200, `Esperado 200, veio ${r.status}`);
        const list = r.data.results ?? r.data;
        return `${Array.isArray(list) ? list.length : '?'} usuário(s)`;
      },
    },

    // ── Limpeza final ────────────────────────────────────────────────
    {
      group: 'Limpeza',
      id: 'deleteEvent',
      label: 'Excluir evento de teste',
      async run(ctx) {
        if (!ctx.state.createdEventId) skip('nenhum evento criado por este diagnóstico');
        const r = await ctx.http('DELETE', `/events/${ctx.state.createdEventId}/`, {
          token: ctx.state.adminToken,
        });
        assert(r.status === 204, `Esperado 204, veio ${r.status}`);
        return 'evento de teste removido';
      },
    },

    // ── Frontend (deploy) ────────────────────────────────────────────
    {
      group: 'Frontend (deploy)',
      id: 'frontHome',
      label: 'Home publicada responde 200',
      async run(ctx) {
        if (!ctx.siteOrigin) skip('origem do site indisponível (rodando fora do navegador)');
        let res;
        try {
          res = await ctx.fetchImpl(`${ctx.siteOrigin}${ctx.siteBase}/`, { method: 'GET' });
        } catch {
          throw new Error('falha ao buscar a home publicada');
        }
        assert(res.ok, `home retornou ${res.status} (deveria ser 200 — verificar prerender/index.html)`);
        return '200 OK';
      },
    },
  ];
}

// Executa as verificações em sequência, compartilhando o contexto (tokens, ids).
// onUpdate é chamado a cada transição de estado para a UI atualizar ao vivo.
export async function runDiagnostics({
  baseUrl,
  siteOrigin = '',
  siteBase = '',
  creds = {},
  fetchImpl,
  onUpdate,
  checks,
} = {}) {
  const realFetch =
    fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  if (!realFetch) throw new Error('fetch indisponível e nenhum fetchImpl fornecido');

  const ctx = {
    http: createHttp(baseUrl, realFetch),
    fetchImpl: realFetch,
    state: {},
    creds,
    siteOrigin,
    siteBase,
  };

  const list = checks || buildChecks();
  const results = list.map((c) => ({
    id: c.id,
    label: c.label,
    group: c.group,
    status: 'pending',
    detail: '',
    ms: 0,
  }));

  const emit = () => onUpdate && onUpdate(results.map((r) => ({ ...r })));
  emit();

  for (let i = 0; i < list.length; i++) {
    results[i].status = 'running';
    emit();
    const t0 = now();
    try {
      const detail = await list[i].run(ctx);
      results[i].status = 'pass';
      results[i].detail = detail || '';
    } catch (e) {
      results[i].status = e && e.skip ? 'skip' : 'fail';
      results[i].detail = e && e.message ? e.message : String(e);
    }
    results[i].ms = Math.round(now() - t0);
    emit();
  }

  return results;
}

export function summarize(results) {
  const s = { pass: 0, fail: 0, skip: 0, total: results.length, ms: 0 };
  for (const r of results) {
    if (r.status === 'pass') s.pass++;
    else if (r.status === 'fail') s.fail++;
    else if (r.status === 'skip') s.skip++;
    s.ms += r.ms || 0;
  }
  return s;
}
