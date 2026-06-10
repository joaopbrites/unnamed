import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/api', () => ({
  api: { getUserProfile: vi.fn() },
}));
vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (fn) => {
      fn({ id: 1, username: 'joao', is_staff: false });
      return () => {};
    },
  },
  isLoggedIn: { subscribe: (fn) => { fn(true); return () => {}; } },
  isAdmin: { subscribe: (fn) => { fn(false); return () => {}; } },
}));

import ProfilePage from './[id]/+page.svelte';
import { api } from '$lib/api';

const fakeProfile = {
  id: 2,
  username: 'maria',
  first_name: 'Maria',
  last_name: 'Silva',
  bio: 'Moradora do bairro desde 2010.',
  date_joined: '2022-03-15T00:00:00Z',
  recent_registrations: [
    { id: 1, event: 10, status: 'confirmed', registered_at: '2026-05-01T00:00:00Z' },
  ],
  recent_comments: [
    { id: 5, text: 'Ótimo evento!', created_at: '2026-05-10T00:00:00Z' },
  ],
};

beforeEach(() => {
  api.getUserProfile.mockResolvedValue({ ok: true, data: fakeProfile });
});

describe('ProfilePage', () => {
  it('exibe nome completo do usuário', async () => {
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
  });

  it('exibe o username', async () => {
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('@maria')).toBeInTheDocument();
    });
  });

  it('exibe a bio do usuário', async () => {
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Moradora do bairro desde 2010.')).toBeInTheDocument();
    });
  });

  it('exibe as inscrições recentes', async () => {
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Últimas Inscrições em Eventos')).toBeInTheDocument();
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
    });
  });

  it('exibe os comentários recentes', async () => {
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Últimos Comentários')).toBeInTheDocument();
      expect(screen.getByText('"Ótimo evento!"')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de perfil não encontrado quando API falha', async () => {
    api.getUserProfile.mockResolvedValue({ ok: false, data: null });
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Perfil não encontrado.')).toBeInTheDocument();
    });
  });

  it('exibe "Nenhuma inscrição recente" quando lista está vazia', async () => {
    api.getUserProfile.mockResolvedValue({
      ok: true,
      data: { ...fakeProfile, recent_registrations: [] },
    });
    render(ProfilePage);
    await waitFor(() => {
      expect(screen.getByText('Nenhuma inscrição recente.')).toBeInTheDocument();
    });
  });
});
