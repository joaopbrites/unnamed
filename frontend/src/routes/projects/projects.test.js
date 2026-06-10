import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: { getProjects: vi.fn() },
}));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(false); return () => {}; } },
}));

import ProjectsPage from './+page.svelte';
import { api } from '$lib/api';

const fakeProjects = [
  {
    id: 1, title: 'Reforma da Quadra', description: 'Recuperação do piso',
    status: 'active', start_date: '2026-01-01', end_date: null,
  },
  {
    id: 2, title: 'Horta Comunitária', description: 'Implantação de horta',
    status: 'planning', start_date: '2026-07-01', end_date: null,
  },
  {
    id: 3, title: 'Pintura da Sede', description: 'Revitalização da sede',
    status: 'completed', start_date: '2025-01-01', end_date: '2025-06-01',
  },
];

beforeEach(() => {
  api.getProjects.mockResolvedValue({ ok: true, data: { results: fakeProjects } });
});

describe('ProjectsPage', () => {
  it('renderiza o título da página', async () => {
    render(ProjectsPage);
    expect(screen.getByText('Projetos')).toBeInTheDocument();
  });

  it('exibe os projetos carregados', async () => {
    render(ProjectsPage);
    await waitFor(() => {
      expect(screen.getByText('Reforma da Quadra')).toBeInTheDocument();
      expect(screen.getByText('Horta Comunitária')).toBeInTheDocument();
    });
  });

  it('exibe badge de status correto', async () => {
    render(ProjectsPage);
    await waitFor(() => {
      // getAllByText porque "Planejamento" aparece também no <option> do filtro
      expect(screen.getAllByText('Planejamento').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Concluído')).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há projetos', async () => {
    api.getProjects.mockResolvedValue({ ok: true, data: { results: [] } });
    render(ProjectsPage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum projeto encontrado.')).toBeInTheDocument();
    });
  });

  it('tem filtro de status com todas as opções', async () => {
    render(ProjectsPage);
    const select = screen.getByLabelText('Filtrar por status');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Ativos')).toBeInTheDocument();
    expect(screen.getByText('Concluídos')).toBeInTheDocument();
    expect(screen.getByText('Cancelados')).toBeInTheDocument();
  });

  it('passa parâmetro de status ao filtrar', async () => {
    const user = userEvent.setup();
    render(ProjectsPage);
    await waitFor(() => screen.getByText('Reforma da Quadra'));

    const select = screen.getByLabelText('Filtrar por status');
    await user.selectOptions(select, 'active');

    await waitFor(() => {
      expect(api.getProjects).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });
  });

  it('exibe data de início nos cards', async () => {
    render(ProjectsPage);
    await waitFor(() => {
      expect(screen.getByText('Início: 2026-01-01')).toBeInTheDocument();
    });
  });
});
