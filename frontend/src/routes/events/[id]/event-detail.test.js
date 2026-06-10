import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const adminRef = vi.hoisted(() => ({ value: false }));
const userRef = vi.hoisted(() => ({ value: null }));

vi.mock('$lib/api', () => ({
  api: {
    getEvent: vi.fn(),
    registerEvent: vi.fn(),
    unregisterEvent: vi.fn(),
    deleteEvent: vi.fn(),
    getComments: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
  page: { subscribe: (fn) => { fn({ params: { id: '1' } }); return () => {}; } },
}));
vi.mock('$lib/stores/auth', () => ({
  authStore: { subscribe: (fn) => { fn(userRef.value); return () => {}; } },
  isAdmin: { subscribe: (fn) => { fn(adminRef.value); return () => {}; } },
}));

import EventDetailPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

const fakeEvent = {
  id: 1,
  title: 'Festa Junina 2026',
  description: 'Festa tradicional do bairro com forró e comidas típicas.',
  date: '2026-06-15T19:00:00Z',
  location: 'Quadra poliesportiva',
  status: 'upcoming',
  capacity: 100,
  confirmed_count: 40,
};

beforeEach(() => {
  vi.clearAllMocks();
  adminRef.value = false;
  userRef.value = null;
  api.getEvent.mockResolvedValue({ ok: true, data: fakeEvent });
  api.getComments.mockResolvedValue({ ok: true, data: { results: [] } });
});

describe('EventDetailPage', () => {
  it('exibe o título do evento', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Festa Junina 2026')).toBeInTheDocument();
    });
  });

  it('exibe o local do evento', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText(/Quadra poliesportiva/)).toBeInTheDocument();
    });
  });

  it('exibe a descrição do evento', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText(/Festa tradicional do bairro/)).toBeInTheDocument();
    });
  });

  it('exibe badge de vagas disponíveis', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText('60 vaga(s) disponível')).toBeInTheDocument();
    });
  });

  it('exibe badge "Esgotado" quando capacidade atingida', async () => {
    api.getEvent.mockResolvedValue({
      ok: true,
      data: { ...fakeEvent, capacity: 50, confirmed_count: 50 },
    });
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Esgotado — inscrição em fila de espera')).toBeInTheDocument();
    });
  });

  it('exibe "Vagas ilimitadas" quando capacity é null', async () => {
    api.getEvent.mockResolvedValue({
      ok: true,
      data: { ...fakeEvent, capacity: null },
    });
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Vagas ilimitadas')).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando evento não é encontrado', async () => {
    api.getEvent.mockResolvedValue({ ok: false, data: {} });
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Evento não encontrado.')).toBeInTheDocument();
    });
  });

  it('exibe link de login para se inscrever quando não autenticado', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      // A página exibe "Faça login para se inscrever" — CommentSection exibe outro link
      const loginLinks = screen.getAllByRole('link', { name: 'Faça login' });
      expect(loginLinks.some((l) => l.getAttribute('href') === '/login')).toBe(true);
    });
  });

  it('tem link de voltar para a lista de eventos', () => {
    render(EventDetailPage);
    expect(screen.getByRole('link', { name: '← Voltar para eventos' }))
      .toHaveAttribute('href', '/events');
  });
});

describe('EventDetailPage — usuário autenticado', () => {
  beforeEach(() => {
    userRef.value = { id: 1, username: 'joao' };
  });

  it('exibe botão de inscrição para usuário logado', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Inscrever-se' })).toBeInTheDocument();
    });
  });

  it('chama api.registerEvent ao clicar em inscrever', async () => {
    api.registerEvent.mockResolvedValue({ ok: true, data: { status: 'confirmed' } });
    const user = userEvent.setup();
    render(EventDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Inscrever-se' }));

    await user.click(screen.getByRole('button', { name: 'Inscrever-se' }));

    await waitFor(() => {
      expect(api.registerEvent).toHaveBeenCalledWith('1');
    });
  });

  it('exibe status "Inscrito" após inscrição confirmada', async () => {
    api.registerEvent.mockResolvedValue({ ok: true, data: { status: 'confirmed' } });
    const user = userEvent.setup();
    render(EventDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Inscrever-se' }));

    await user.click(screen.getByRole('button', { name: 'Inscrever-se' }));

    await waitFor(() => {
      expect(screen.getByText('Inscrição confirmada!')).toBeInTheDocument();
    });
  });

  it('exibe status "Na fila de espera" após inscrição waitlisted', async () => {
    api.registerEvent.mockResolvedValue({ ok: true, data: { status: 'waitlisted' } });
    const user = userEvent.setup();
    render(EventDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Inscrever-se' }));

    await user.click(screen.getByRole('button', { name: 'Inscrever-se' }));

    await waitFor(() => {
      expect(screen.getByText('Você está na fila de espera.')).toBeInTheDocument();
    });
  });
});

describe('EventDetailPage — admin', () => {
  beforeEach(() => {
    adminRef.value = true;
  });

  it('exibe botão de editar para admin', async () => {
    render(EventDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Editar' }))
        .toHaveAttribute('href', '/admin/events/1/edit');
    });
  });

  it('solicita confirmação antes de excluir', async () => {
    const user = userEvent.setup();
    render(EventDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(screen.getByText('Confirmar?')).toBeInTheDocument();
    });
  });

  it('chama api.deleteEvent ao confirmar exclusão', async () => {
    api.deleteEvent.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(EventDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));

    await waitFor(() => {
      expect(api.deleteEvent).toHaveBeenCalledWith('1');
      expect(goto).toHaveBeenCalledWith('/events');
    });
  });
});
