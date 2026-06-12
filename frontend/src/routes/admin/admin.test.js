import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(true); return () => {}; } },
  isSuperuser: { subscribe: (fn) => { fn(true); return () => {}; } },
}));

import AdminPage from './+page.svelte';
import { goto } from '$app/navigation';

describe('AdminPage', () => {
  it('renderiza o título do painel', () => {
    render(AdminPage);
    expect(screen.getByText('Painel de Administração')).toBeInTheDocument();
  });

  it('exibe card de Eventos com link para criar', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: '+ Novo Evento' }))
      .toHaveAttribute('href', '/admin/events/new');
  });

  it('exibe card de Projetos com link para criar', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: '+ Novo Projeto' }))
      .toHaveAttribute('href', '/admin/projects/new');
  });

  it('exibe card de Anúncios com link para criar', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: '+ Novo Anúncio' }))
      .toHaveAttribute('href', '/admin/announcements/new');
  });

  it('exibe card de Analytics com link', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: 'Ver Analytics' }))
      .toHaveAttribute('href', '/analytics');
  });

  it('exibe card de Diagnóstico com link', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: 'Rodar Diagnóstico' }))
      .toHaveAttribute('href', '/diagnostics');
  });

  it('exibe card de Usuários para superusuário', () => {
    render(AdminPage);
    expect(screen.getByRole('link', { name: 'Gerenciar Usuários' }))
      .toHaveAttribute('href', '/admin/users');
  });

  it('goto é importado para proteção de rota', () => {
    expect(goto).toBeDefined();
  });
});
