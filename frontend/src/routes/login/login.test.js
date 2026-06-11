import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (fn) => { fn(null); return () => {}; },
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  },
}));
vi.mock('$lib/api', () => ({
  api: { me: vi.fn(), verify2FA: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import LoginPage from './+page.svelte';
import { authStore } from '$lib/stores/auth';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
  authStore.login.mockResolvedValue({ ok: false, data: { detail: 'Erro' } });
  api.me.mockResolvedValue({ ok: false, data: null });
});

describe('LoginPage', () => {
  it('renderiza o formulário de login', () => {
    render(LoginPage);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('chama authStore.login com credenciais preenchidas', async () => {
    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(authStore.login).toHaveBeenCalledWith('joao', 'senha123');
    });
  });

  it('exibe mensagem de erro para credenciais inválidas', async () => {
    authStore.login.mockResolvedValue({ ok: false, data: { detail: 'Usuário ou senha inválidos.' } });
    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'errado');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Usuário ou senha inválidos.')).toBeInTheDocument();
    });
  });

  it('redireciona para / após login bem-sucedido sem 2FA', async () => {
    authStore.login.mockResolvedValue({ ok: true, data: { access: 'tok' } });
    api.me.mockResolvedValue({ ok: true, data: { id: 1, username: 'joao', totp_enabled: false } });

    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('exibe formulário TOTP quando 2FA está ativo', async () => {
    authStore.login.mockResolvedValue({ ok: true, data: { access: 'tok' } });
    api.me.mockResolvedValue({ ok: true, data: { id: 1, username: 'joao', totp_enabled: true } });

    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Autenticação em dois fatores')).toBeInTheDocument();
      expect(screen.getByLabelText('Código TOTP')).toBeInTheDocument();
    });
  });

  it('tem link para cadastro', () => {
    render(LoginPage);
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/register');
  });

  it('exibe erro e libera o botão quando authStore.login lança exceção (servidor fora)', async () => {
    authStore.login.mockRejectedValue(new Error('Failed to fetch'));
    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      // botão deve voltar a "Entrar" (loading = false)
      expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled();
    });
  });

  it('exibe erro de conexão quando api retorna ok:false por falha de rede', async () => {
    authStore.login.mockResolvedValue({ ok: false, data: { detail: 'Não foi possível conectar ao servidor. Tente novamente.' } });
    const user = userEvent.setup();
    render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível conectar ao servidor. Tente novamente.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled();
    });
  });
});

describe('LoginPage — Verificação TOTP', () => {
  async function renderWithTotp() {
    authStore.login.mockResolvedValue({ ok: true, data: {} });
    api.me.mockResolvedValue({ ok: true, data: { totp_enabled: true } });

    const user = userEvent.setup();
    const result = render(LoginPage);

    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => screen.getByLabelText('Código TOTP'));

    return { user, ...result };
  }

  it('chama api.verify2FA com o código informado', async () => {
    api.verify2FA.mockResolvedValue({ ok: true, data: { verified: true } });
    const { user } = await renderWithTotp();

    await user.type(screen.getByLabelText('Código TOTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    await waitFor(() => {
      expect(api.verify2FA).toHaveBeenCalledWith('123456');
    });
  });

  it('exibe erro para código inválido', async () => {
    api.verify2FA.mockResolvedValue({ ok: false, data: { detail: 'Código inválido.' } });
    const { user } = await renderWithTotp();

    await user.type(screen.getByLabelText('Código TOTP'), '000000');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    await waitFor(() => {
      expect(screen.getByText('Código inválido.')).toBeInTheDocument();
    });
  });
});
