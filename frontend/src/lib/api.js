// Normaliza a base da API: tolera VITE_API_URL com ou sem o sufixo `/api`
// (e com barra final). Sem isso, uma variável mal configurada como
// "https://host.onrender.com" faria o app chamar ".../token/" em vez de
// ".../api/token/", quebrando login e cadastro em produção.
export function normalizeApiBase(raw) {
  const trimmed = String(raw ?? '').replace(/\/+$/, '');
  return /\/api$/.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export const BASE = normalizeApiBase(import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api');

function getAccess() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function getRefresh() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('refresh_token') : null;
}

const NETWORK_ERR = { detail: 'Não foi possível conectar ao servidor. Tente novamente.' };

async function refreshAccessToken() {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch {
    // rede indisponível — mantém sessão como está
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  return false;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  const access = getAccess();
  if (access) headers['Authorization'] = `Bearer ${access}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    return { ok: false, status: 0, json: async () => NETWORK_ERR };
  }

  if (res.status === 401 && getRefresh()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccess()}`;
      try {
        res = await fetch(`${BASE}${path}`, { ...options, headers });
      } catch {
        return { ok: false, status: 0, json: async () => NETWORK_ERR };
      }
    }
  }

  return res;
}

export const api = {
  // Auth
  async login(username, password) {
    let res;
    try {
      res = await fetch(`${BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return { ok: false, data: NETWORK_ERR };
    }
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      return { ok: true, data };
    }
    return { ok: false, data: await res.json() };
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async register(userData) {
    let res;
    try {
      res = await fetch(`${BASE}/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch {
      return { ok: false, data: NETWORK_ERR };
    }
    return { ok: res.ok, data: await res.json() };
  },

  async me() {
    const res = await request('/accounts/me/');
    return { ok: res.ok, data: res.ok ? await res.json() : null };
  },

  // Events
  async getEvents(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await request(`/events/${q ? '?' + q : ''}`);
    return { ok: res.ok, data: await res.json() };
  },

  async getEvent(id) {
    const res = await request(`/events/${id}/`);
    return { ok: res.ok, data: await res.json() };
  },

  async registerEvent(id) {
    const res = await request(`/events/${id}/register/`, { method: 'POST' });
    return { ok: res.ok, data: await res.json() };
  },

  async unregisterEvent(id) {
    const res = await request(`/events/${id}/unregister/`, { method: 'DELETE' });
    return { ok: res.ok };
  },

  async createEvent(data) {
    const res = await request('/events/', { method: 'POST', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async updateEvent(id, data) {
    const res = await request(`/events/${id}/`, { method: 'PUT', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async deleteEvent(id) {
    const res = await request(`/events/${id}/`, { method: 'DELETE' });
    return { ok: res.ok };
  },

  // Projects
  async getProjects(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await request(`/projects/${q ? '?' + q : ''}`);
    return { ok: res.ok, data: await res.json() };
  },

  async getProject(id) {
    const res = await request(`/projects/${id}/`);
    return { ok: res.ok, data: await res.json() };
  },

  async createProject(data) {
    const res = await request('/projects/', { method: 'POST', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async updateProject(id, data) {
    const res = await request(`/projects/${id}/`, { method: 'PUT', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async deleteProject(id) {
    const res = await request(`/projects/${id}/`, { method: 'DELETE' });
    return { ok: res.ok };
  },

  // Announcements
  async getAnnouncements() {
    const res = await request('/announcements/');
    return { ok: res.ok, data: await res.json() };
  },

  async getAnnouncement(id) {
    const res = await request(`/announcements/${id}/`);
    return { ok: res.ok, data: await res.json() };
  },

  async createAnnouncement(data) {
    const res = await request('/announcements/', { method: 'POST', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async updateAnnouncement(id, data) {
    const res = await request(`/announcements/${id}/`, { method: 'PUT', body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async deleteAnnouncement(id) {
    const res = await request(`/announcements/${id}/`, { method: 'DELETE' });
    return { ok: res.ok };
  },

  // Comments
  async getComments(contentType, objectId) {
    const res = await request(`/comments/?content_type=${contentType}&object_id=${objectId}`);
    return { ok: res.ok, data: await res.json() };
  },

  async createComment(data) {
    const res = await request('/comments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ok: res.ok, data: await res.json() };
  },

  async getReplies(commentId) {
    const res = await request(`/comments/${commentId}/replies/`);
    return { ok: res.ok, data: await res.json() };
  },

  async reactComment(commentId, reactionType) {
    const res = await request(`/comments/${commentId}/react/`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
    return { ok: res.ok, data: await res.json() };
  },

  async reportComment(commentId) {
    const res = await request(`/comments/${commentId}/report/`, { method: 'POST' });
    return { ok: res.ok, data: await res.json() };
  },

  // Notifications
  async getNotifications(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await request(`/notifications/${q ? '?' + q : ''}`);
    return { ok: res.ok, data: await res.json() };
  },

  async getUnreadCount() {
    const res = await request('/notifications/unread_count/');
    return { ok: res.ok, data: await res.json() };
  },

  async markRead(id) {
    const res = await request(`/notifications/${id}/mark_read/`, { method: 'POST' });
    return { ok: res.ok };
  },

  async markAllRead() {
    const res = await request('/notifications/mark_all_read/', { method: 'POST' });
    return { ok: res.ok };
  },

  // Analytics (admin only)
  async getAnalyticsSummary() {
    const res = await request('/analytics/summary/');
    return { ok: res.ok, data: await res.json() };
  },

  async getPageviewHistory(days = 7) {
    const res = await request(`/analytics/pageviews/?days=${days}`);
    return { ok: res.ok, data: await res.json() };
  },

  // User management (superuser only)
  async getUsers() {
    const res = await request('/accounts/users/');
    return { ok: res.ok, data: await res.json() };
  },

  async updateUserRole(id, data) {
    const res = await request(`/accounts/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return { ok: res.ok, data: await res.json() };
  },

  // Search
  async search(query) {
    const res = await request(`/search/?q=${encodeURIComponent(query)}`);
    return { ok: res.ok, data: await res.json() };
  },

  // Profile
  async getUserProfile(id) {
    const res = await request(`/accounts/${id}/profile/`);
    return { ok: res.ok, data: await res.json() };
  },

  // 2FA TOTP
  async setup2FA() {
    const res = await request('/accounts/2fa/setup/', { method: 'POST' });
    return { ok: res.ok, data: await res.json() };
  },

  async confirm2FA(code) {
    const res = await request('/accounts/2fa/confirm/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return { ok: res.ok, data: await res.json() };
  },

  async disable2FA(code) {
    const res = await request('/accounts/2fa/disable/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return { ok: res.ok, data: await res.json() };
  },

  async verify2FA(code) {
    const res = await request('/accounts/2fa/verify/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return { ok: res.ok, data: await res.json() };
  },
};
