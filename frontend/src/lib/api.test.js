import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function ok(data) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
}
function fail(data, status = 400) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve(data) });
}

describe('api.login', () => {
  it('armazena tokens no localStorage quando bem-sucedido', async () => {
    mockFetch.mockResolvedValueOnce(ok({ access: 'abc', refresh: 'xyz' }));
    const result = await api.login('user', 'pass');
    expect(result.ok).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'abc');
    expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'xyz');
  });

  it('retorna ok: false para credenciais inválidas', async () => {
    mockFetch.mockResolvedValueOnce(fail({ detail: 'No active account' }));
    const result = await api.login('user', 'wrong');
    expect(result.ok).toBe(false);
  });
});

describe('api.logout', () => {
  it('remove tokens do localStorage', () => {
    api.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
  });
});

describe('api.register', () => {
  it('envia dados de cadastro corretamente', async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: 1, username: 'novo' }));
    const result = await api.register({ username: 'novo', password: 'pass1234' });
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/register/'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('api.getEvents', () => {
  it('busca lista de eventos', async () => {
    mockFetch.mockResolvedValueOnce(ok({ results: [{ id: 1, title: 'Evento' }] }));
    const { ok: isOk, data } = await api.getEvents();
    expect(isOk).toBe(true);
    expect(data.results).toHaveLength(1);
  });

  it('passa parâmetros de filtro na URL', async () => {
    mockFetch.mockResolvedValueOnce(ok({ results: [] }));
    await api.getEvents({ status: 'upcoming' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=upcoming'),
      expect.any(Object)
    );
  });
});

describe('api.search', () => {
  it('encoda a query na URL', async () => {
    mockFetch.mockResolvedValueOnce(ok({ events: [], projects: [], announcements: [] }));
    await api.search('festa junina');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=festa%20junina'),
      expect.any(Object)
    );
  });
});

describe('api.getUnreadCount', () => {
  it('retorna contagem de notificações não lidas', async () => {
    mockFetch.mockResolvedValueOnce(ok({ count: 3 }));
    const { ok: isOk, data } = await api.getUnreadCount();
    expect(isOk).toBe(true);
    expect(data.count).toBe(3);
  });
});

describe('api.reactComment', () => {
  it('envia reação de like para o endpoint correto', async () => {
    mockFetch.mockResolvedValueOnce(ok({ reaction_type: 'like' }));
    await api.reactComment(42, 'like');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/comments/42/react/'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
