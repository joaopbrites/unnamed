import { writable } from 'svelte/store';
import { api } from '$lib/api';

function createNotificationsStore() {
  const { subscribe, set, update } = writable({ notifications: [], unreadCount: 0 });

  return {
    subscribe,
    async fetchUnreadCount() {
      const { ok, data } = await api.getUnreadCount();
      if (ok) update((s) => ({ ...s, unreadCount: data.count ?? 0 }));
    },
    async fetchNotifications() {
      const { ok, data } = await api.getNotifications();
      if (ok) {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        update((s) => ({ ...s, notifications: list }));
      }
    },
    async markRead(id) {
      const { ok } = await api.markRead(id);
      if (ok) {
        update((s) => ({
          ...s,
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, s.unreadCount - 1),
        }));
      }
    },
    async markAllRead() {
      const { ok } = await api.markAllRead();
      if (ok) {
        update((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
      }
    },
    reset() {
      set({ notifications: [], unreadCount: 0 });
    },
  };
}

export const notificationsStore = createNotificationsStore();
