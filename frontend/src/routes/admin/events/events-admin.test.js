import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    createEvent: vi.fn(),
    getEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
  page: { subscribe: (fn) => { fn({ params: { id: '5' } }); return () => {}; } },
}));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(true); return () => {}; } },
}));

import NewEventPage from './new/+page.svelte';
import EditEventPage from './[id]/edit/+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
  api.getEvent.mockResolvedValue({
    ok: true,
    data: {
      id: 5, title: 'Festa Junina', description: 'Festa tradicional',
      date: '2026-06-15T19:00:00Z', location: 'Quadra', capacity: 100, status: 'upcoming',
    },
  });
});

describe('NewEventPage', () => {
  it('renderiza o formulário de criação', () => {
    render(NewEventPage);
    expect(screen.getByText('Novo Evento')).toBeInTheDocument();
  });

  it('exibe todos os campos do formulário', () => {
    render(NewEventPage);
    expect(screen.getByLabelText('Título *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição *')).toBeInTheDocument();
    expect(screen.getByLabelText('Data e Hora *')).toBeInTheDocument();
    expect(screen.getByLabelText('Local *')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('submete o formulário e navega para o evento criado', async () => {
    const user = userEvent.setup();
    api.createEvent.mockResolvedValue({ ok: true, data: { id: 99 } });

    const { container } = render(NewEventPage);

    await user.type(screen.getByLabelText('Título *'), 'Novo Evento Teste');
    await user.type(screen.getByLabelText('Descrição *'), 'Descrição teste');
    fireEvent.change(screen.getByLabelText('Data e Hora *'), { target: { value: '2026-06-15T19:00' } });
    await user.type(screen.getByLabelText('Local *'), 'Local teste');

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(api.createEvent).toHaveBeenCalled();
      expect(goto).toHaveBeenCalledWith('/events/99');
    });
  });

  it('chama api.createEvent com os dados preenchidos', async () => {
    const user = userEvent.setup();
    api.createEvent.mockResolvedValue({ ok: true, data: { id: 1 } });

    const { container } = render(NewEventPage);
    await user.type(screen.getByLabelText('Título *'), 'Festa do Bairro');
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(api.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Festa do Bairro' })
      );
    });
  });

  it('tem link de voltar para o painel admin', () => {
    render(NewEventPage);
    expect(screen.getByRole('link', { name: '← Painel Admin' }))
      .toHaveAttribute('href', '/admin');
  });

  it('campo status tem opção padrão "Próximo"', () => {
    render(NewEventPage);
    const select = screen.getByLabelText('Status');
    expect(select.value).toBe('upcoming');
  });
});

describe('EditEventPage', () => {
  it('carrega os dados do evento no formulário', async () => {
    render(EditEventPage);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Festa Junina')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Quadra')).toBeInTheDocument();
    });
  });

  it('renderiza o título de edição', async () => {
    render(EditEventPage);
    await waitFor(() => {
      expect(screen.getByText('Editar Evento')).toBeInTheDocument();
    });
  });

  it('submete as alterações e navega de volta ao evento', async () => {
    api.updateEvent.mockResolvedValue({ ok: true, data: { id: 5 } });

    const { container } = render(EditEventPage);
    await waitFor(() => screen.getByDisplayValue('Festa Junina'));

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(api.updateEvent).toHaveBeenCalledWith('5', expect.any(Object));
      expect(goto).toHaveBeenCalledWith('/events/5');
    });
  });

  it('tem link de voltar para o evento', async () => {
    render(EditEventPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: '← Voltar ao evento' }))
        .toHaveAttribute('href', '/events/5');
    });
  });
});
