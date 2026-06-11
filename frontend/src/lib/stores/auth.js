import { writable, derived } from 'svelte/store';
import { api } from '$lib/api';

function createAuthStore() {
  const { subscribe, set } = writable(null);

  return {
    subscribe,
    async init() {
      if (typeof localStorage === 'undefined') return;
      const access = localStorage.getItem('access_token');
      if (!access) return;
      const { ok, data } = await api.me();
      set(ok ? data : null);
    },
    async login(username, password) {
      const result = await api.login(username, password);
      if (result.ok) {
        const { ok, data } = await api.me();
        if (ok) set(data);
      }
      return result;
    },
    logout() {
      api.logout();
      set(null);
    },
    setUser(user) {
      set(user);
    },
  };
}

export const authStore = createAuthStore();
export const isLoggedIn = derived(authStore, ($auth) => $auth !== null);
export const isAdmin = derived(authStore, ($auth) => $auth?.is_staff ?? false);
export const isSuperuser = derived(authStore, ($auth) => $auth?.is_superuser ?? false);
