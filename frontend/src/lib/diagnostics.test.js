import { describe, it, expect, vi } from 'vitest';
import {
  runDiagnostics,
  summarize,
  createHttp,
  buildChecks,
  DIAG_USER,
} from './diagnostics.js';

const API = 'http://test/api';

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

// Router de fetch falso que imita os contratos reais da API.
function makeApi({ events = [{ id: 5 }], failPath = null, loginStatus = 200 } = {}) {
  return vi.fn(async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    const { pathname } = new URL(url);
    const auth = (opts.headers && opts.headers.Authorization) || '';
    const body = opts.body ? JSON.parse(opts.body) : {};
    const key = `${method} ${pathname}`;

    if (failPath && pathname === failPath) return jsonResponse(500, { detail: 'erro forçado' });

    // Frontend publicado (origem do site)
    if (method === 'GET' && pathname === '/') return jsonResponse(200, '<html>');

    switch (key) {
      case 'GET /api/events/':
        return jsonResponse(200, { count: events.length, results: events });
      case 'GET /api/projects/':
        return jsonResponse(200, { count: 0, results: [] });
      case 'GET /api/announcements/':
        return jsonResponse(200, { count: 0, results: [] });
      case 'GET /api/search/':
        return jsonResponse(200, { results: [] });
      case 'POST /api/accounts/register/':
        return jsonResponse(201, { id: 9, username: DIAG_USER.username });
      case 'POST /api/token/': {
        if (loginStatus !== 200) return jsonResponse(loginStatus, { detail: 'inválido' });
        const isAdmin = body.username !== DIAG_USER.username;
        return jsonResponse(200, {
          access: isAdmin ? 'adm-token' : 'member-token',
          refresh: isAdmin ? 'adm-refresh' : 'member-refresh',
        });
      }
      case 'POST /api/token/refresh/':
        return jsonResponse(200, { access: 'member-token-2' });
      case 'GET /api/accounts/me/':
        if (auth.includes('adm-token')) {
          return jsonResponse(200, {
            username: 'root',
            is_member: true,
            is_staff: true,
            is_superuser: true,
          });
        }
        return jsonResponse(200, {
          username: DIAG_USER.username,
          is_member: true,
          is_staff: false,
          is_superuser: false,
        });
      case 'POST /api/events/':
        return jsonResponse(201, { id: 77, status: 'upcoming' });
      case 'PUT /api/events/77/':
        return jsonResponse(200, { id: 77 });
      case 'DELETE /api/events/77/':
        return jsonResponse(204);
      case 'POST /api/projects/':
        return jsonResponse(201, { id: 88 });
      case 'DELETE /api/projects/88/':
        return jsonResponse(204);
      case 'POST /api/announcements/':
        return jsonResponse(201, { id: 99 });
      case 'DELETE /api/announcements/99/':
        return jsonResponse(204);
      case 'GET /api/analytics/summary/':
        return jsonResponse(200, { total_pageviews: 0 });
      case 'GET /api/accounts/users/':
        return jsonResponse(200, [{ id: 1 }, { id: 2 }, { id: 3 }]);
      case 'GET /api/notifications/':
        return jsonResponse(200, { results: [] });
      case 'GET /api/notifications/unread_count/':
        return jsonResponse(200, { unread_count: 0 });
    }

    if (method === 'POST' && /^\/api\/events\/\d+\/register\/$/.test(pathname))
      return jsonResponse(201, { status: 'confirmed' });
    if (method === 'DELETE' && /^\/api\/events\/\d+\/unregister\/$/.test(pathname))
      return jsonResponse(204);
    if (method === 'POST' && pathname === '/api/comments/') return jsonResponse(201, { id: 555 });
    if (method === 'GET' && pathname === '/api/comments/')
      return jsonResponse(200, { results: [{ id: 555 }] });
    if (method === 'POST' && /^\/api\/comments\/\d+\/react\/$/.test(pathname))
      return jsonResponse(201, { detail: "Reação 'like' registrada." });
    if (method === 'DELETE' && /^\/api\/comments\/\d+\/$/.test(pathname)) return jsonResponse(204);

    return jsonResponse(404, { detail: 'rota não mapeada no mock' });
  });
}

const byId = (results) => Object.fromEntries(results.map((r) => [r.id, r]));

const baseRun = (fetchImpl, extra = {}) =>
  runDiagnostics({
    baseUrl: API,
    siteOrigin: 'http://site',
    siteBase: '',
    fetchImpl,
    ...extra,
  });

describe('createHttp', () => {
  it('faz parse do JSON e devolve status', async () => {
    const http = createHttp(API, makeApi());
    const r = await http('GET', '/events/');
    expect(r.status).toBe(200);
    expect(r.ok).toBe(true);
    expect(r.data.results).toEqual([{ id: 5 }]);
  });

  it('falha de rede vira status 0 sem lançar exceção', async () => {
    const http = createHttp(API, vi.fn(async () => { throw new Error('offline'); }));
    const r = await http('GET', '/events/');
    expect(r.status).toBe(0);
    expect(r.networkError).toBe(true);
  });

  it('envia o header Authorization quando há token', async () => {
    const fetchImpl = makeApi();
    const http = createHttp(API, fetchImpl);
    await http('GET', '/accounts/me/', { token: 'abc' });
    expect(fetchImpl).toHaveBeenCalledWith(
      `${API}/accounts/me/`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer abc' }) }),
    );
  });
});

describe('runDiagnostics — sem credenciais de admin', () => {
  it('passa conectividade/leitura/auth/membro e pula admin/superuser', async () => {
    const results = await baseRun(makeApi({ events: [{ id: 5 }] }));
    const r = byId(results);

    // conectividade + leitura + auth
    for (const id of ['wake', 'projects', 'announcements', 'search', 'register', 'login', 'me', 'refresh']) {
      expect(r[id].status, id).toBe('pass');
    }
    // ações de membro usam o evento existente (id 5)
    for (const id of ['registerEvent', 'comment', 'listComments', 'react', 'notifications', 'unregisterEvent', 'deleteComment']) {
      expect(r[id].status, id).toBe('pass');
    }
    // admin/superuser/limpeza pulados (sem credenciais)
    for (const id of ['adminLogin', 'createEvent', 'editEvent', 'project', 'announcement', 'analytics', 'listUsers', 'deleteEvent']) {
      expect(r[id].status, id).toBe('skip');
    }
    // frontend publicado responde
    expect(r.frontHome.status).toBe('pass');

    const s = summarize(results);
    expect(s.fail).toBe(0);
    expect(s.pass).toBe(16);
    expect(s.skip).toBe(8);
  });

  it('pula ações em evento quando o banco está vazio', async () => {
    const results = await baseRun(makeApi({ events: [] }));
    const r = byId(results);
    expect(r.wake.status).toBe('pass');
    expect(r.wake.detail).toContain('0 evento');
    for (const id of ['registerEvent', 'comment', 'listComments']) {
      expect(r[id].status, id).toBe('skip');
    }
    expect(summarize(results).fail).toBe(0);
  });
});

describe('runDiagnostics — com credenciais de admin', () => {
  it('roda CRUD de admin, usa o evento de teste e lista usuários como superuser', async () => {
    const results = await baseRun(makeApi({ events: [] }), {
      creds: { adminUsername: 'root', adminPassword: 'secret' },
    });
    const r = byId(results);

    expect(r.adminLogin.status).toBe('pass');
    expect(r.adminLogin.detail).toContain('superuser=true');
    for (const id of ['createEvent', 'editEvent', 'project', 'announcement', 'analytics']) {
      expect(r[id].status, id).toBe('pass');
    }
    // sem evento prévio, o membro usa o evento criado pelo admin (#77)
    expect(r.registerEvent.status).toBe('pass');
    expect(r.comment.status).toBe('pass');
    expect(r.listUsers.status).toBe('pass');
    expect(r.listUsers.detail).toContain('3 usuário');
    expect(r.deleteEvent.status).toBe('pass');

    expect(summarize(results).fail).toBe(0);
  });
});

describe('runDiagnostics — resiliência a falhas', () => {
  it('marca apenas o endpoint quebrado como falha e segue o resto', async () => {
    const results = await baseRun(makeApi({ failPath: '/api/projects/' }));
    const r = byId(results);
    expect(r.projects.status).toBe('fail');
    expect(r.projects.detail).toContain('500');
    // verificações independentes continuam passando
    expect(r.wake.status).toBe('pass');
    expect(r.search.status).toBe('pass');
    expect(r.login.status).toBe('pass');
    expect(summarize(results).fail).toBe(1);
  });

  it('propaga skip às dependências quando o login falha', async () => {
    const results = await baseRun(makeApi({ loginStatus: 401 }));
    const r = byId(results);
    expect(r.register.status).toBe('pass'); // endpoint público funciona
    expect(r.login.status).toBe('fail');
    expect(r.me.status).toBe('skip');
    expect(r.refresh.status).toBe('skip');
    expect(r.registerEvent.status).toBe('skip');
  });
});

describe('summarize', () => {
  it('conta passou/falhou/pulado e soma o tempo', () => {
    const s = summarize([
      { status: 'pass', ms: 10 },
      { status: 'fail', ms: 5 },
      { status: 'skip', ms: 0 },
      { status: 'pass', ms: 7 },
    ]);
    expect(s).toEqual({ pass: 2, fail: 1, skip: 1, total: 4, ms: 22 });
  });
});
