import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    getEvents: vi.fn(),
  },
}));
vi.mock('$lib/stores/auth', () => ({
  authStore: { subscribe: (fn) => { fn(null); return () => {}; } },
  isLoggedIn: { subscribe: (fn) => { fn(false); return () => {}; } },
  isAdmin: { subscribe: (fn) => { fn(false); return () => {}; } },
}));

import EventsPage from './+page.svelte';
import { api } from '$lib/api';

const fakeEvents = [
  {
    id: 1, title: 'Festa Junina', date: '2026-06-15T19:00:00Z',
    location: 'Quadra', status: 'upcoming', capacity: 100, confirmed_count: 40,
  },
  {
    id: 2, title: 'Torneio de Futebol', date: '2026-07-01T08:00:00Z',
    location: 'Campo', status: 'upcoming', capacity: 22, confirmed_count: 22,
  },
];

beforeEach(() => {
  api.getEvents.mockResolvedValue({ ok: true, data: { results: fakeEvents } });
});

describe('EventsPage', () => {
  it('renderiza o título da página', async () => {
    render(EventsPage);
    expect(screen.getByText('Eventos')).toBeInTheDocument();
  });

  it('exibe a lista de eventos carregados', async () => {
    render(EventsPage);
    await waitFor(() => {
      expect(screen.getByText('Festa Junina')).toBeInTheDocument();
      expect(screen.getByText('Torneio de Futebol')).toBeInTheDocument();
    });
  });

  it('exibe indicador de vagas disponíveis', async () => {
    render(EventsPage);
    await waitFor(() => {
      expect(screen.getByText('60 / 100 vagas')).toBeInTheDocument();
    });
  });

  it('exibe "Esgotado — Fila de espera" quando sem vagas', async () => {
    render(EventsPage);
    await waitFor(() => {
      expect(screen.getByText('Esgotado — Fila de espera')).toBeInTheDocument();
    });
  });

  it('exibe "Vagas ilimitadas" quando capacity é null', async () => {
    api.getEvents.mockResolvedValue({
      ok: true,
      data: { results: [{ id: 3, title: 'Reunião', date: '2026-06-20T10:00:00Z', location: 'Sede', status: 'upcoming', capacity: null, confirmed_count: 0 }] },
    });
    render(EventsPage);
    await waitFor(() => {
      expect(screen.getByText('Vagas ilimitadas')).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há eventos', async () => {
    api.getEvents.mockResolvedValue({ ok: true, data: { results: [] } });
    render(EventsPage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum evento encontrado.')).toBeInTheDocument();
    });
  });

  it('tem filtro de status com opções corretas', async () => {
    render(EventsPage);
    const select = screen.getByLabelText('Filtrar por status');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Próximos')).toBeInTheDocument();
    expect(screen.getByText('Encerrados')).toBeInTheDocument();
  });

  it('refaz busca ao digitar no campo de pesquisa', async () => {
    const user = userEvent.setup();
    render(EventsPage);
    await waitFor(() => screen.getByText('Festa Junina'));

    const input = screen.getByLabelText('Buscar evento');
    await user.type(input, 'festa');

    await waitFor(() => {
      expect(api.getEvents).toHaveBeenCalledWith(expect.objectContaining({ search: 'festa' }));
    });
  });
});
