import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/api', () => ({
  api: { getAnnouncements: vi.fn() },
}));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(false); return () => {}; } },
}));

import AnnouncementsPage from './+page.svelte';
import { api } from '$lib/api';

const fakeAnnouncements = [
  {
    id: 1, title: 'Reunião de Diretoria', content: 'Reunião na sede às 19h.',
    category: 'meeting', is_pinned: true, created_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 2, title: 'Manutenção da Quadra', content: 'A quadra estará fechada na sexta.',
    category: 'maintenance', is_pinned: false, created_at: '2026-05-28T08:00:00Z',
  },
  {
    id: 3, title: 'Inscrições abertas', content: 'Inscrições para o torneio abertas.',
    category: 'event', is_pinned: false, created_at: '2026-05-20T12:00:00Z',
  },
];

beforeEach(() => {
  api.getAnnouncements.mockResolvedValue({ ok: true, data: { results: fakeAnnouncements } });
});

describe('AnnouncementsPage', () => {
  it('renderiza o título da página', async () => {
    render(AnnouncementsPage);
    expect(screen.getByText('Anúncios')).toBeInTheDocument();
  });

  it('exibe os anúncios carregados', async () => {
    render(AnnouncementsPage);
    await waitFor(() => {
      expect(screen.getByText('Reunião de Diretoria')).toBeInTheDocument();
      expect(screen.getByText('Manutenção da Quadra')).toBeInTheDocument();
      expect(screen.getByText('Inscrições abertas')).toBeInTheDocument();
    });
  });

  it('exibe o ícone de fixado para anúncios is_pinned', async () => {
    render(AnnouncementsPage);
    await waitFor(() => {
      // O emoji 📌 aparece para anúncios fixados
      const pins = screen.getAllByText('📌');
      expect(pins.length).toBeGreaterThan(0);
    });
  });

  it('exibe badges de categoria corretas', async () => {
    render(AnnouncementsPage);
    await waitFor(() => {
      expect(screen.getByText('Reunião')).toBeInTheDocument();
      expect(screen.getByText('Manutenção')).toBeInTheDocument();
      expect(screen.getByText('Evento')).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há anúncios', async () => {
    api.getAnnouncements.mockResolvedValue({ ok: true, data: { results: [] } });
    render(AnnouncementsPage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum anúncio no momento.')).toBeInTheDocument();
    });
  });

  it('anúncios fixados aparecem antes dos demais', async () => {
    render(AnnouncementsPage);
    await waitFor(() => {
      const items = screen.getAllByRole('link');
      const titles = items.map((el) => el.textContent);
      const idxPinned = titles.findIndex((t) => t.includes('Reunião de Diretoria'));
      const idxNormal = titles.findIndex((t) => t.includes('Manutenção da Quadra'));
      expect(idxPinned).toBeLessThan(idxNormal);
    });
  });

  it('cada anúncio é um link para a página de detalhes', async () => {
    render(AnnouncementsPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Reunião de Diretoria/ }))
        .toHaveAttribute('href', '/announcements/1');
    });
  });
});
