import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const isAdminRef = vi.hoisted(() => ({ value: false }));

vi.mock('$lib/api', () => ({
  api: {
    getAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    getComments: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
  page: { subscribe: (fn) => { fn({ params: { id: '1' } }); return () => {}; } },
}));
vi.mock('$lib/stores/auth', () => ({
  authStore: { subscribe: (fn) => { fn(null); return () => {}; } },
  isAdmin: { subscribe: (fn) => { fn(isAdminRef.value); return () => {}; } },
}));

import AnnouncementDetailPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

const fakeAnnouncement = {
  id: 1,
  title: 'Reunião de Diretoria',
  content: 'Reunião ordinária na sede às 19h.',
  category: 'meeting',
  is_pinned: true,
  created_at: '2026-06-01T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  isAdminRef.value = false;
  api.getAnnouncement.mockResolvedValue({ ok: true, data: fakeAnnouncement });
  api.getComments.mockResolvedValue({ ok: true, data: { results: [] } });
});

describe('AnnouncementDetailPage', () => {
  it('exibe o título do anúncio', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Reunião de Diretoria')).toBeInTheDocument();
    });
  });

  it('exibe o conteúdo do anúncio', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Reunião ordinária na sede às 19h.')).toBeInTheDocument();
    });
  });

  it('exibe badge de categoria correta', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Reunião')).toBeInTheDocument();
    });
  });

  it('exibe ícone de fixado para anúncio is_pinned', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByText('📌')).toBeInTheDocument();
    });
  });

  it('não exibe ícone de fixado para anúncio não fixado', async () => {
    api.getAnnouncement.mockResolvedValue({
      ok: true,
      data: { ...fakeAnnouncement, is_pinned: false },
    });
    render(AnnouncementDetailPage);
    await waitFor(() => screen.getByText('Reunião de Diretoria'));
    expect(screen.queryByText('📌')).not.toBeInTheDocument();
  });

  it('exibe mensagem quando anúncio não é encontrado', async () => {
    api.getAnnouncement.mockResolvedValue({ ok: false, data: {} });
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Anúncio não encontrado.')).toBeInTheDocument();
    });
  });

  it('tem link de voltar para a lista de anúncios', () => {
    render(AnnouncementDetailPage);
    expect(screen.getByRole('link', { name: '← Voltar para anúncios' }))
      .toHaveAttribute('href', '/announcements');
  });
});

describe('AnnouncementDetailPage — admin', () => {
  beforeEach(() => {
    isAdminRef.value = true;
  });

  it('exibe botão de editar para admin', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Editar' }))
        .toHaveAttribute('href', '/admin/announcements/1/edit');
    });
  });

  it('exibe botão de excluir para admin', async () => {
    render(AnnouncementDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    });
  });

  it('solicita confirmação antes de excluir', async () => {
    const user = userEvent.setup();
    render(AnnouncementDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(screen.getByText('Confirmar?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sim' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Não' })).toBeInTheDocument();
    });
  });

  it('chama api.deleteAnnouncement ao confirmar exclusão', async () => {
    api.deleteAnnouncement.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(AnnouncementDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));

    await waitFor(() => {
      expect(api.deleteAnnouncement).toHaveBeenCalledWith('1');
      expect(goto).toHaveBeenCalledWith('/announcements');
    });
  });

  it('cancela exclusão ao clicar em Não', async () => {
    const user = userEvent.setup();
    render(AnnouncementDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Não' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
      expect(api.deleteAnnouncement).not.toHaveBeenCalled();
    });
  });
});
