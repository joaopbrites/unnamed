import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,testqr') },
}));
vi.mock('$lib/api', () => ({
  api: { setup2FA: vi.fn(), confirm2FA: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/auth', () => ({
  authStore: { subscribe: (fn) => { fn({ id: 1, username: 'joao' }); return () => {}; } },
}));

import Setup2FAPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
  api.setup2FA.mockResolvedValue({
    ok: true,
    data: {
      secret: 'JBSWY3DPEHPK3PXP',
      otpauth_uri: 'otpauth://totp/SDSC:joao?secret=JBSWY3DPEHPK3PXP&issuer=SDSC',
    },
  });
});

describe('Setup2FAPage', () => {
  it('renderiza o título da página', async () => {
    render(Setup2FAPage);
    expect(screen.getByText('Autenticação em Dois Fatores')).toBeInTheDocument();
  });

  it('chama api.setup2FA ao montar a página', async () => {
    render(Setup2FAPage);
    await waitFor(() => {
      expect(api.setup2FA).toHaveBeenCalled();
    });
  });

  it('exibe o QR code após carregar', async () => {
    render(Setup2FAPage);
    await waitFor(() => {
      expect(screen.getByAltText('QR Code para 2FA')).toBeInTheDocument();
    });
  });

  it('exibe a chave secreta para inserção manual', async () => {
    render(Setup2FAPage);
    await waitFor(() => {
      expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando api.setup2FA falha', async () => {
    api.setup2FA.mockResolvedValue({ ok: false, data: {} });
    render(Setup2FAPage);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Erro ao iniciar configuração do 2FA.')).toBeInTheDocument();
    });
  });

  it('chama api.confirm2FA com o código digitado', async () => {
    api.confirm2FA.mockResolvedValue({ ok: true, data: {} });
    const user = userEvent.setup();
    render(Setup2FAPage);
    await waitFor(() => screen.getByAltText('QR Code para 2FA'));

    await user.type(screen.getByPlaceholderText('000000'), '123456');
    await user.click(screen.getByRole('button', { name: 'Ativar 2FA' }));

    await waitFor(() => {
      expect(api.confirm2FA).toHaveBeenCalledWith('123456');
    });
  });

  it('exibe tela de sucesso após confirmação com código válido', async () => {
    api.confirm2FA.mockResolvedValue({ ok: true, data: {} });
    const user = userEvent.setup();
    render(Setup2FAPage);
    await waitFor(() => screen.getByAltText('QR Code para 2FA'));

    await user.type(screen.getByPlaceholderText('000000'), '123456');
    await user.click(screen.getByRole('button', { name: 'Ativar 2FA' }));

    await waitFor(() => {
      expect(screen.getByText('2FA ativado com sucesso!')).toBeInTheDocument();
    });
  });

  it('exibe erro quando código de confirmação é inválido', async () => {
    api.confirm2FA.mockResolvedValue({ ok: false, data: { detail: 'Código inválido.' } });
    const user = userEvent.setup();
    render(Setup2FAPage);
    await waitFor(() => screen.getByAltText('QR Code para 2FA'));

    await user.type(screen.getByPlaceholderText('000000'), '000000');
    await user.click(screen.getByRole('button', { name: 'Ativar 2FA' }));

    await waitFor(() => {
      expect(screen.getByText('Código inválido.')).toBeInTheDocument();
    });
  });

  it('botão Ativar 2FA fica desabilitado com campo vazio', async () => {
    render(Setup2FAPage);
    await waitFor(() => screen.getByAltText('QR Code para 2FA'));
    expect(screen.getByRole('button', { name: 'Ativar 2FA' })).toBeDisabled();
  });
});
