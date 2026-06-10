import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: { search: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import SearchPage from './+page.svelte';
import { api } from '$lib/api';

const fakeResults = {
  events: [{ id: 1, title: 'Festa Junina', date: '2026-06-15T10:00:00Z', location: 'Quadra' }],
  projects: [{ id: 2, title: 'Reforma', description: 'Obras' }],
  announcements: [{ id: 3, title: 'Aviso', content: 'Conteúdo do aviso' }],
};

describe('SearchPage', () => {
  it('renderiza o campo de busca', () => {
    render(SearchPage);
    expect(screen.getByLabelText('Campo de busca')).toBeInTheDocument();
    expect(screen.getByText('Busca Global')).toBeInTheDocument();
  });

  it('exibe resultados de eventos, projetos e anúncios', async () => {
    api.search.mockResolvedValue({ ok: true, data: fakeResults });
    const user = userEvent.setup();
    render(SearchPage);

    const input = screen.getByLabelText('Campo de busca');
    await user.type(input, 'festa');
    await user.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Festa Junina')).toBeInTheDocument();
      expect(screen.getByText('Reforma')).toBeInTheDocument();
      expect(screen.getByText('Aviso')).toBeInTheDocument();
    });
  });

  it('exibe cabeçalhos de seção por tipo', async () => {
    api.search.mockResolvedValue({ ok: true, data: fakeResults });
    const user = userEvent.setup();
    render(SearchPage);

    const input = screen.getByLabelText('Campo de busca');
    await user.type(input, 'teste');
    await user.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Eventos (1)')).toBeInTheDocument();
      expect(screen.getByText('Projetos (1)')).toBeInTheDocument();
      expect(screen.getByText('Anúncios (1)')).toBeInTheDocument();
    });
  });

  it('exibe total de resultados', async () => {
    api.search.mockResolvedValue({ ok: true, data: fakeResults });
    const user = userEvent.setup();
    render(SearchPage);

    await user.type(screen.getByLabelText('Campo de busca'), 'teste');
    await user.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(screen.getByText(/resultado/)).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há resultados', async () => {
    api.search.mockResolvedValue({ ok: true, data: { events: [], projects: [], announcements: [] } });
    const user = userEvent.setup();
    render(SearchPage);

    await user.type(screen.getByLabelText('Campo de busca'), 'xyzxyz');
    await user.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('Nenhum resultado'))).toBeInTheDocument();
    });
  });

  it('chama api.search com a query correta', async () => {
    api.search.mockResolvedValue({ ok: true, data: { events: [], projects: [], announcements: [] } });
    const user = userEvent.setup();
    render(SearchPage);

    await user.type(screen.getByLabelText('Campo de busca'), 'festa');
    await user.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(api.search).toHaveBeenCalledWith('festa');
    });
  });
});
