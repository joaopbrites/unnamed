import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';

vi.mock('$lib/api', () => ({
  api: {
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

vi.mock('$lib/stores/auth', () => ({
  authStore: { subscribe: (fn) => { fn({ id: 1, username: 'super', is_superuser: true }); return () => {}; } },
  isSuperuser: { subscribe: (fn) => { fn(true); return () => {}; } },
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

import UsersPage from './+page.svelte';
import { api } from '$lib/api';

const fakeUsers = [
  { id: 1, username: 'super', email: 'super@test.com', is_member: true, is_staff: true, is_superuser: true, date_joined: '2024-01-01T00:00:00Z' },
  { id: 2, username: 'staff', email: 'staff@test.com', is_member: true, is_staff: true, is_superuser: false, date_joined: '2024-02-01T00:00:00Z' },
  { id: 3, username: 'membro', email: 'membro@test.com', is_member: true, is_staff: false, is_superuser: false, date_joined: '2024-03-01T00:00:00Z' },
];

beforeEach(() => {
  api.getUsers.mockResolvedValue({ ok: true, data: fakeUsers });
  api.updateUserRole.mockResolvedValue({ ok: true, data: { ...fakeUsers[2], is_staff: true } });
});

describe('UsersAdminPage — renderização', () => {
  it('exibe o título da página', async () => {
    render(UsersPage);
    await waitFor(() => expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument());
  });

  it('exibe a lista de usuários após carregar', async () => {
    render(UsersPage);
    await waitFor(() => {
      // usa emails para evitar colisão com badges de texto igual ao username
      expect(screen.getByText('super@test.com')).toBeInTheDocument();
      expect(screen.getByText('staff@test.com')).toBeInTheDocument();
      expect(screen.getByText('membro@test.com')).toBeInTheDocument();
    });
  });

  it('exibe os cabeçalhos da tabela', async () => {
    render(UsersPage);
    await waitFor(() => {
      expect(screen.getByText('Usuário')).toBeInTheDocument();
      expect(screen.getByText('E-mail')).toBeInTheDocument();
      // "Membro" aparece no th e na legenda — verificamos o th via role
      expect(screen.getByRole('columnheader', { name: 'Membro' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Admin' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Superusuário' })).toBeInTheDocument();
    });
  });

  it('marca o usuário atual com badge "você"', async () => {
    render(UsersPage);
    await waitFor(() => {
      expect(screen.getByText('você')).toBeInTheDocument();
    });
  });

  it('exibe skeleton durante o carregamento', () => {
    api.getUsers.mockReturnValue(new Promise(() => {}));
    const { container } = render(UsersPage);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('exibe link de volta ao painel admin', async () => {
    render(UsersPage);
    await waitFor(() => {
      expect(screen.getByText('← Painel Admin')).toBeInTheDocument();
    });
  });
});

describe('UsersAdminPage — toggles', () => {
  it('chama updateUserRole ao clicar em toggle de outro usuário', async () => {
    render(UsersPage);
    await waitFor(() => screen.getByText('membro@test.com'));

    // membro.is_staff = false → toggle envia true
    const toggle = screen.getByRole('button', { name: 'Alternar is_staff de membro' });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(api.updateUserRole).toHaveBeenCalledWith(3, { is_staff: true });
    });
  });

  it('desabilita toggles do usuário atual (isSelf)', async () => {
    render(UsersPage);
    await waitFor(() => screen.getByText('super@test.com'));

    const selfToggles = screen.getAllByRole('button', { name: /de super/ });
    selfToggles.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('exibe mensagem de erro ao tentar alterar a si mesmo', async () => {
    render(UsersPage);
    await waitFor(() => screen.getByText('super@test.com'));

    const selfToggle = screen.getAllByRole('button', { name: /de super/ })[0];
    fireEvent.click(selfToggle);

    await waitFor(() => {
      expect(screen.getByText('Não é possível alterar as próprias permissões.')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de sucesso após salvar', async () => {
    render(UsersPage);
    await waitFor(() => screen.getByText('membro@test.com'));

    const toggle = screen.getByRole('button', { name: 'Alternar is_staff de membro' });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Salvo.')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando API falha', async () => {
    api.updateUserRole.mockResolvedValue({ ok: false, data: { detail: 'Erro interno.' } });
    render(UsersPage);
    await waitFor(() => screen.getByText('membro@test.com'));

    const toggle = screen.getByRole('button', { name: 'Alternar is_staff de membro' });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Erro interno.')).toBeInTheDocument();
    });
  });
});
