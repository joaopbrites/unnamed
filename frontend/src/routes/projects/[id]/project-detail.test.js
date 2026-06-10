import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const isAdminRef = vi.hoisted(() => ({ value: false }));

vi.mock('$lib/api', () => ({
  api: {
    getProject: vi.fn(),
    deleteProject: vi.fn(),
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

import ProjectDetailPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

const fakeProject = {
  id: 1,
  title: 'Reforma da Quadra',
  description: 'Recuperação do piso e iluminação da quadra poliesportiva.',
  status: 'active',
  start_date: '2026-05-01',
  end_date: '2026-08-31',
};

beforeEach(() => {
  vi.clearAllMocks();
  isAdminRef.value = false;
  api.getProject.mockResolvedValue({ ok: true, data: fakeProject });
  api.getComments.mockResolvedValue({ ok: true, data: { results: [] } });
});

describe('ProjectDetailPage', () => {
  it('exibe o título do projeto', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Reforma da Quadra')).toBeInTheDocument();
    });
  });

  it('exibe a descrição do projeto', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText(/Recuperação do piso/)).toBeInTheDocument();
    });
  });

  it('exibe badge de status correto', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });
  });

  it('exibe data de início', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText(/2026-05-01/)).toBeInTheDocument();
    });
  });

  it('exibe data de fim', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText(/2026-08-31/)).toBeInTheDocument();
    });
  });

  it('não exibe data de fim quando não definida', async () => {
    api.getProject.mockResolvedValue({
      ok: true,
      data: { ...fakeProject, end_date: null },
    });
    render(ProjectDetailPage);
    await waitFor(() => screen.getByText('Reforma da Quadra'));
    expect(screen.queryByText(/Fim:/)).not.toBeInTheDocument();
  });

  it('exibe mensagem quando projeto não é encontrado', async () => {
    api.getProject.mockResolvedValue({ ok: false, data: {} });
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByText('Projeto não encontrado.')).toBeInTheDocument();
    });
  });

  it('tem link de voltar para a lista de projetos', () => {
    render(ProjectDetailPage);
    expect(screen.getByRole('link', { name: '← Voltar para projetos' }))
      .toHaveAttribute('href', '/projects');
  });
});

describe('ProjectDetailPage — admin', () => {
  beforeEach(() => {
    isAdminRef.value = true;
  });

  it('exibe botão de editar para admin', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Editar' }))
        .toHaveAttribute('href', '/admin/projects/1/edit');
    });
  });

  it('exibe botão de excluir para admin', async () => {
    render(ProjectDetailPage);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    });
  });

  it('solicita confirmação antes de excluir', async () => {
    const user = userEvent.setup();
    render(ProjectDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(screen.getByText('Confirmar?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sim' })).toBeInTheDocument();
    });
  });

  it('chama api.deleteProject ao confirmar exclusão', async () => {
    api.deleteProject.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(ProjectDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));

    await waitFor(() => {
      expect(api.deleteProject).toHaveBeenCalledWith('1');
      expect(goto).toHaveBeenCalledWith('/projects');
    });
  });

  it('cancela exclusão ao clicar em Não', async () => {
    const user = userEvent.setup();
    render(ProjectDetailPage);
    await waitFor(() => screen.getByRole('button', { name: 'Excluir' }));

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Não' }));

    await waitFor(() => {
      expect(api.deleteProject).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    });
  });
});
