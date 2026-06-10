import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/api', () => ({
  api: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authStore, isLoggedIn, isAdmin } from './auth';
import { api } from '$lib/api';

beforeEach(() => {
  authStore.setUser(null);
  vi.clearAllMocks();
});

describe('authStore', () => {
  it('inicia com valor null', () => {
    expect(get(authStore)).toBeNull();
  });

  it('seta usuário com setUser', () => {
    authStore.setUser({ id: 1, username: 'joao', is_staff: false });
    expect(get(authStore)).toMatchObject({ username: 'joao' });
  });

  it('isLoggedIn é true quando há usuário', () => {
    authStore.setUser({ id: 1, username: 'joao' });
    expect(get(isLoggedIn)).toBe(true);
  });

  it('isLoggedIn é false quando usuário é null', () => {
    authStore.setUser(null);
    expect(get(isLoggedIn)).toBe(false);
  });

  it('isAdmin é true para staff', () => {
    authStore.setUser({ id: 1, username: 'admin', is_staff: true });
    expect(get(isAdmin)).toBe(true);
  });

  it('isAdmin é false para usuário comum', () => {
    authStore.setUser({ id: 2, username: 'membro', is_staff: false });
    expect(get(isAdmin)).toBe(false);
  });
});

describe('authStore.login', () => {
  it('faz login bem-sucedido e seta usuário', async () => {
    api.login.mockResolvedValue({ ok: true, data: { access: 'tok' } });
    api.me.mockResolvedValue({ ok: true, data: { id: 1, username: 'joao', is_staff: false } });

    const result = await authStore.login('joao', 'senha');

    expect(result.ok).toBe(true);
    expect(get(authStore)).toMatchObject({ username: 'joao' });
    expect(get(isLoggedIn)).toBe(true);
  });

  it('não seta usuário em caso de falha no login', async () => {
    api.login.mockResolvedValue({ ok: false, data: { detail: 'Credenciais inválidas' } });

    const result = await authStore.login('joao', 'errado');

    expect(result.ok).toBe(false);
    expect(get(authStore)).toBeNull();
  });
});

describe('authStore.logout', () => {
  it('remove usuário e chama api.logout', () => {
    authStore.setUser({ id: 1, username: 'joao' });
    authStore.logout();
    expect(get(authStore)).toBeNull();
    expect(api.logout).toHaveBeenCalled();
  });
});
