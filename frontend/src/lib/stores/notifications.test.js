import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/api', () => ({
  api: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

import { notificationsStore } from './notifications';
import { api } from '$lib/api';

const fakeNotifications = [
  { id: 1, verb: 'Novo comentário no seu evento', is_read: false, created_at: '2026-06-01T10:00:00Z', target_str: 'events.event' },
  { id: 2, verb: 'Alguém reagiu ao seu comentário', is_read: false, created_at: '2026-06-01T11:00:00Z', target_str: 'comments.comment' },
  { id: 3, verb: 'Nova inscrição no seu evento', is_read: true, created_at: '2026-05-30T08:00:00Z', target_str: 'events.event' },
];

beforeEach(() => {
  notificationsStore.reset();
  vi.clearAllMocks();
});

describe('notificationsStore', () => {
  it('inicia com estado vazio', () => {
    const state = get(notificationsStore);
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('fetchUnreadCount atualiza contagem', async () => {
    api.getUnreadCount.mockResolvedValue({ ok: true, data: { count: 5 } });
    await notificationsStore.fetchUnreadCount();
    expect(get(notificationsStore).unreadCount).toBe(5);
  });

  it('fetchUnreadCount não altera estado se API falhar', async () => {
    api.getUnreadCount.mockResolvedValue({ ok: false, data: null });
    await notificationsStore.fetchUnreadCount();
    expect(get(notificationsStore).unreadCount).toBe(0);
  });

  it('fetchNotifications carrega lista de notificações', async () => {
    api.getNotifications.mockResolvedValue({ ok: true, data: fakeNotifications });
    await notificationsStore.fetchNotifications();
    expect(get(notificationsStore).notifications).toHaveLength(3);
  });

  it('fetchNotifications suporta formato paginado (results)', async () => {
    api.getNotifications.mockResolvedValue({
      ok: true,
      data: { results: fakeNotifications, count: 3 },
    });
    await notificationsStore.fetchNotifications();
    expect(get(notificationsStore).notifications).toHaveLength(3);
  });

  it('markRead marca notificação como lida e decrementa contagem', async () => {
    api.getNotifications.mockResolvedValue({ ok: true, data: fakeNotifications });
    api.getUnreadCount.mockResolvedValue({ ok: true, data: { count: 2 } });
    api.markRead.mockResolvedValue({ ok: true });

    await notificationsStore.fetchNotifications();
    await notificationsStore.fetchUnreadCount();
    await notificationsStore.markRead(1);

    const state = get(notificationsStore);
    const n1 = state.notifications.find((n) => n.id === 1);
    expect(n1.is_read).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it('markAllRead marca todas as notificações como lidas', async () => {
    api.getNotifications.mockResolvedValue({ ok: true, data: fakeNotifications });
    api.markAllRead.mockResolvedValue({ ok: true });

    await notificationsStore.fetchNotifications();
    await notificationsStore.markAllRead();

    const state = get(notificationsStore);
    expect(state.notifications.every((n) => n.is_read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('reset restaura estado inicial', async () => {
    api.getNotifications.mockResolvedValue({ ok: true, data: fakeNotifications });
    await notificationsStore.fetchNotifications();
    notificationsStore.reset();

    const state = get(notificationsStore);
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('markRead chama api.markRead com o ID correto', async () => {
    api.getNotifications.mockResolvedValue({ ok: true, data: fakeNotifications });
    api.markRead.mockResolvedValue({ ok: true });
    await notificationsStore.fetchNotifications();
    await notificationsStore.markRead(2);
    expect(api.markRead).toHaveBeenCalledWith(2);
  });
});
