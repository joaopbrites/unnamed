import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: { register: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import RegisterPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterPage', () => {
  it('renderiza o formulário de cadastro', () => {
    render(RegisterPage);
    expect(screen.getByRole('heading', { name: 'Criar Conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuário *')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha *')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('chama api.register com os dados do formulário', async () => {
    api.register.mockResolvedValue({ ok: true, data: { id: 1 } });
    const user = userEvent.setup();
    render(RegisterPage);

    await user.type(screen.getByLabelText('Usuário *'), 'novousuario');
    await user.type(screen.getByLabelText('E-mail'), 'novo@email.com');
    await user.type(screen.getByLabelText('Senha *'), 'senha12345');
    await user.click(screen.getByRole('button', { name: 'Criar Conta' }));

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'novousuario', email: 'novo@email.com' })
      );
    });
  });

  it('exibe mensagem de sucesso após cadastro', async () => {
    api.register.mockResolvedValue({ ok: true, data: { id: 1 } });
    const user = userEvent.setup();
    render(RegisterPage);

    await user.type(screen.getByLabelText('Usuário *'), 'novousuario');
    await user.type(screen.getByLabelText('Senha *'), 'senha12345');
    await user.click(screen.getByRole('button', { name: 'Criar Conta' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Conta criada/)).toBeInTheDocument();
    });
  });

  it('exibe erro de campo quando API retorna validação', async () => {
    api.register.mockResolvedValue({
      ok: false,
      data: { username: ['Este usuário já existe.'] },
    });
    const user = userEvent.setup();
    render(RegisterPage);

    await user.type(screen.getByLabelText('Usuário *'), 'existente');
    await user.type(screen.getByLabelText('Senha *'), 'senha12345');
    await user.click(screen.getByRole('button', { name: 'Criar Conta' }));

    await waitFor(() => {
      expect(screen.getByText('Este usuário já existe.')).toBeInTheDocument();
    });
  });

  it('tem link para a página de login', () => {
    render(RegisterPage);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('tem campos para nome e sobrenome', () => {
    render(RegisterPage);
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
  });
});
