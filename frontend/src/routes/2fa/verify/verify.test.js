import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: { verify2FA: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import Verify2FAPage from './+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Verify2FAPage', () => {
  it('renderiza o título da página', () => {
    render(Verify2FAPage);
    expect(screen.getByText('Verificação em dois fatores')).toBeInTheDocument();
  });

  it('exibe o campo de código TOTP', () => {
    render(Verify2FAPage);
    expect(screen.getByLabelText('Código TOTP')).toBeInTheDocument();
  });

  it('exibe o botão Confirmar', () => {
    render(Verify2FAPage);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('chama api.verify2FA com o código informado', async () => {
    api.verify2FA.mockResolvedValue({ ok: true, data: { verified: true } });
    const user = userEvent.setup();
    render(Verify2FAPage);

    await user.type(screen.getByLabelText('Código TOTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(api.verify2FA).toHaveBeenCalledWith('123456');
    });
  });

  it('redireciona para / após verificação bem-sucedida', async () => {
    api.verify2FA.mockResolvedValue({ ok: true, data: { verified: true } });
    const user = userEvent.setup();
    render(Verify2FAPage);

    await user.type(screen.getByLabelText('Código TOTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('exibe erro para código inválido com mensagem da API', async () => {
    api.verify2FA.mockResolvedValue({ ok: false, data: { detail: 'Código inválido. Tente novamente.' } });
    const user = userEvent.setup();
    render(Verify2FAPage);

    await user.type(screen.getByLabelText('Código TOTP'), '000000');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Código inválido. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro padrão quando API não retorna detail', async () => {
    api.verify2FA.mockResolvedValue({ ok: false, data: {} });
    const user = userEvent.setup();
    render(Verify2FAPage);

    await user.type(screen.getByLabelText('Código TOTP'), '000000');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Código inválido. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('não chama api.verify2FA se código está vazio', async () => {
    const { container } = render(Verify2FAPage);
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(api.verify2FA).not.toHaveBeenCalled();
    });
  });

  it('não redireciona quando verified é false', async () => {
    api.verify2FA.mockResolvedValue({ ok: true, data: { verified: false } });
    const user = userEvent.setup();
    render(Verify2FAPage);

    await user.type(screen.getByLabelText('Código TOTP'), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(goto).not.toHaveBeenCalled();
    });
  });
});
