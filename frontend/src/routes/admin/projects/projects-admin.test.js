import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
  page: { subscribe: (fn) => { fn({ params: { id: '3' } }); return () => {}; } },
}));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(true); return () => {}; } },
}));

import NewProjectPage from './new/+page.svelte';
import EditProjectPage from './[id]/edit/+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
  api.getProject.mockResolvedValue({
    ok: true,
    data: {
      id: 3, title: 'Reforma da Quadra', description: 'Recuperação do piso',
      start_date: '2026-01-01', end_date: null, status: 'active',
    },
  });
});

describe('NewProjectPage', () => {
  it('renderiza o formulário de criação', () => {
    render(NewProjectPage);
    expect(screen.getByText('Novo Projeto')).toBeInTheDocument();
  });

  it('exibe todos os campos do formulário', () => {
    render(NewProjectPage);
    expect(screen.getByLabelText('Título *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição *')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Início')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Término')).toBeInTheDocument();
  });

  it('submete o formulário e navega para o projeto criado', async () => {
    const user = userEvent.setup();
    api.createProject.mockResolvedValue({ ok: true, data: { id: 42 } });

    render(NewProjectPage);
    await user.type(screen.getByLabelText('Título *'), 'Projeto Teste');
    await user.type(screen.getByLabelText('Descrição *'), 'Descrição do projeto');
    await user.click(screen.getByRole('button', { name: 'Criar Projeto' }));

    await waitFor(() => {
      expect(api.createProject).toHaveBeenCalled();
      expect(goto).toHaveBeenCalledWith('/projects/42');
    });
  });

  it('tem link de voltar para o painel admin', () => {
    render(NewProjectPage);
    expect(screen.getByRole('link', { name: '← Painel Admin' }))
      .toHaveAttribute('href', '/admin');
  });
});

describe('EditProjectPage', () => {
  it('carrega os dados do projeto no formulário', async () => {
    render(EditProjectPage);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Reforma da Quadra')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Recuperação do piso')).toBeInTheDocument();
    });
  });

  it('renderiza o título de edição', async () => {
    render(EditProjectPage);
    await waitFor(() => {
      expect(screen.getByText('Editar Projeto')).toBeInTheDocument();
    });
  });

  it('submete as alterações e navega de volta ao projeto', async () => {
    const user = userEvent.setup();
    api.updateProject.mockResolvedValue({ ok: true, data: { id: 3 } });

    render(EditProjectPage);
    await waitFor(() => screen.getByDisplayValue('Reforma da Quadra'));
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(api.updateProject).toHaveBeenCalledWith('3', expect.any(Object));
      expect(goto).toHaveBeenCalledWith('/projects/3');
    });
  });

  it('tem link de voltar para o projeto', async () => {
    render(EditProjectPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: '← Voltar ao projeto' }))
        .toHaveAttribute('href', '/projects/3');
    });
  });
});
