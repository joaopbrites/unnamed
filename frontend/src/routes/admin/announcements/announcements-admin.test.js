import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    createAnnouncement: vi.fn(),
    getAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/stores', () => ({
  page: { subscribe: (fn) => { fn({ params: { id: '7' } }); return () => {}; } },
}));
vi.mock('$lib/stores/auth', () => ({
  isAdmin: { subscribe: (fn) => { fn(true); return () => {}; } },
}));

import NewAnnouncementPage from './new/+page.svelte';
import EditAnnouncementPage from './[id]/edit/+page.svelte';
import { api } from '$lib/api';
import { goto } from '$app/navigation';

beforeEach(() => {
  vi.clearAllMocks();
  api.getAnnouncement.mockResolvedValue({
    ok: true,
    data: {
      id: 7, title: 'Reunião de Diretoria', content: 'Reunião às 19h na sede.',
      category: 'meeting', is_pinned: true,
    },
  });
});

describe('NewAnnouncementPage', () => {
  it('renderiza o formulário de criação', () => {
    render(NewAnnouncementPage);
    expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
  });

  it('exibe todos os campos do formulário', () => {
    render(NewAnnouncementPage);
    expect(screen.getByLabelText('Título *')).toBeInTheDocument();
    expect(screen.getByLabelText('Conteúdo *')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixar anúncio no topo')).toBeInTheDocument();
  });

  it('submete o formulário e navega para o anúncio criado', async () => {
    const user = userEvent.setup();
    api.createAnnouncement.mockResolvedValue({ ok: true, data: { id: 20 } });

    render(NewAnnouncementPage);
    await user.type(screen.getByLabelText('Título *'), 'Novo Aviso');
    await user.type(screen.getByLabelText('Conteúdo *'), 'Conteúdo do aviso');
    await user.click(screen.getByRole('button', { name: 'Publicar Anúncio' }));

    await waitFor(() => {
      expect(api.createAnnouncement).toHaveBeenCalled();
      expect(goto).toHaveBeenCalledWith('/announcements/20');
    });
  });

  it('tem link de voltar para o painel admin', () => {
    render(NewAnnouncementPage);
    expect(screen.getByRole('link', { name: '← Painel Admin' }))
      .toHaveAttribute('href', '/admin');
  });

  it('checkbox de fixar começa desmarcado', () => {
    render(NewAnnouncementPage);
    const checkbox = screen.getByLabelText('Fixar anúncio no topo');
    expect(checkbox).not.toBeChecked();
  });
});

describe('EditAnnouncementPage', () => {
  it('carrega os dados do anúncio no formulário', async () => {
    render(EditAnnouncementPage);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Reunião de Diretoria')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Reunião às 19h na sede.')).toBeInTheDocument();
    });
  });

  it('carrega o checkbox is_pinned corretamente', async () => {
    render(EditAnnouncementPage);
    await waitFor(() => {
      const checkbox = screen.getByLabelText('Fixar anúncio no topo');
      expect(checkbox).toBeChecked();
    });
  });

  it('renderiza o título de edição', async () => {
    render(EditAnnouncementPage);
    await waitFor(() => {
      expect(screen.getByText('Editar Anúncio')).toBeInTheDocument();
    });
  });

  it('submete as alterações e navega de volta ao anúncio', async () => {
    const user = userEvent.setup();
    api.updateAnnouncement.mockResolvedValue({ ok: true, data: { id: 7 } });

    render(EditAnnouncementPage);
    await waitFor(() => screen.getByDisplayValue('Reunião de Diretoria'));
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(api.updateAnnouncement).toHaveBeenCalledWith('7', expect.any(Object));
      expect(goto).toHaveBeenCalledWith('/announcements/7');
    });
  });

  it('tem link de voltar para o anúncio', async () => {
    render(EditAnnouncementPage);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: '← Voltar ao anúncio' }))
        .toHaveAttribute('href', '/announcements/7');
    });
  });
});
