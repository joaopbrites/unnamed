import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/api', () => ({
  api: {
    getEvents: vi.fn(),
    getAnnouncements: vi.fn(),
    getProjects: vi.fn(),
  },
}));

import HomePage from './+page.svelte';
import { api } from '$lib/api';

const fakeEvents = [
  { id: 1, title: 'Festa Junina', date: '2026-06-15T19:00:00Z', location: 'Quadra', status: 'upcoming' },
  { id: 2, title: 'Torneio de Futebol', date: '2026-07-01T08:00:00Z', location: 'Campo', status: 'ongoing' },
];

const fakeProjects = [
  { id: 1, title: 'Reforma do Campo', description: 'Reforma completa do campo de futebol.', status: 'active', start_date: '2026-01-10' },
  { id: 2, title: 'Jardim Comunitário', description: 'Criação do jardim comunitário do bairro.', status: 'planning', start_date: null },
];

const fakeAnnouncements = [
  { id: 1, title: 'Reunião Geral', content: 'Reunião geral dos membros marcada para sábado.', is_pinned: true },
  { id: 2, title: 'Nova Diretoria', content: 'Apresentação da nova diretoria eleita.', is_pinned: false },
];

beforeEach(() => {
  api.getEvents.mockResolvedValue({ ok: true, data: { results: fakeEvents } });
  api.getAnnouncements.mockResolvedValue({ ok: true, data: { results: fakeAnnouncements } });
  api.getProjects.mockResolvedValue({ ok: true, data: { results: fakeProjects } });
});

describe('HomePage — hero', () => {
  it('renderiza o nome da associação no hero', () => {
    render(HomePage);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sociedade Desportiva');
  });

  it('renderiza botões de CTA no hero', () => {
    render(HomePage);
    expect(screen.getByRole('link', { name: 'Ver Eventos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nossos Projetos' })).toBeInTheDocument();
  });
});

describe('HomePage — cards de seção', () => {
  it('exibe os 3 cards de seção com suas descrições', () => {
    render(HomePage);
    expect(screen.getByText('Participe das atividades do clube')).toBeInTheDocument();
    expect(screen.getByText('Iniciativas da nossa comunidade')).toBeInTheDocument();
    expect(screen.getByText('Novidades e comunicados')).toBeInTheDocument();
  });

  it('cada card de seção é um link para a rota correta', () => {
    render(HomePage);
    expect(screen.getByRole('link', { name: /Participe das atividades/ })).toHaveAttribute('href', '/events');
    expect(screen.getByRole('link', { name: /Iniciativas da nossa/ })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /Novidades e comunicados/ })).toHaveAttribute('href', '/announcements');
  });
});

describe('HomePage — loading', () => {
  it('exibe skeleton animado enquanto carrega', () => {
    api.getEvents.mockReturnValue(new Promise(() => {}));
    const { container } = render(HomePage);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('remove skeleton após dados carregados', async () => {
    const { container } = render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Festa Junina')).toBeInTheDocument();
    });
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});

describe('HomePage — eventos', () => {
  it('exibe títulos dos eventos carregados', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Festa Junina')).toBeInTheDocument();
      expect(screen.getByText('Torneio de Futebol')).toBeInTheDocument();
    });
  });

  it('exibe data e local do evento', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Quadra')).toBeInTheDocument();
      expect(screen.getByText(/15.*jun/i)).toBeInTheDocument();
    });
  });

  it('exibe badge de status "Próximo" para upcoming', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getAllByText('Próximo').length).toBeGreaterThan(0);
    });
  });

  it('exibe badge "Em andamento" para ongoing', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Em andamento')).toBeInTheDocument();
    });
  });

  it('exibe mensagem vazia quando não há eventos', async () => {
    api.getEvents.mockResolvedValue({ ok: true, data: { results: [] } });
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum evento próximo.')).toBeInTheDocument();
    });
  });
});

describe('HomePage — projetos', () => {
  it('exibe títulos dos projetos carregados', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Reforma do Campo')).toBeInTheDocument();
      expect(screen.getByText('Jardim Comunitário')).toBeInTheDocument();
    });
  });

  it('exibe badge "Ativo" e "Planejamento"', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Planejamento')).toBeInTheDocument();
    });
  });

  it('exibe data de início quando disponível', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText(/Início:.*jan/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem vazia quando não há projetos', async () => {
    api.getProjects.mockResolvedValue({ ok: true, data: { results: [] } });
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum projeto cadastrado.')).toBeInTheDocument();
    });
  });
});

describe('HomePage — anúncios', () => {
  it('exibe títulos dos anúncios carregados', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Reunião Geral')).toBeInTheDocument();
      expect(screen.getByText('Nova Diretoria')).toBeInTheDocument();
    });
  });

  it('exibe badge "📌 Fixado" em anúncio pinned', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('📌 Fixado')).toBeInTheDocument();
    });
  });

  it('não exibe badge fixado em anúncio não pinned', async () => {
    api.getAnnouncements.mockResolvedValue({
      ok: true,
      data: { results: [{ id: 1, title: 'Aviso', content: 'Conteúdo.', is_pinned: false }] },
    });
    render(HomePage);
    await waitFor(() => screen.getByText('Aviso'));
    expect(screen.queryByText('📌 Fixado')).not.toBeInTheDocument();
  });

  it('ordena anúncios fixados primeiro', async () => {
    api.getAnnouncements.mockResolvedValue({
      ok: true,
      data: {
        results: [
          { id: 1, title: 'Normal', content: 'Texto.', is_pinned: false },
          { id: 2, title: 'Fixado', content: 'Texto fixado.', is_pinned: true },
        ],
      },
    });
    render(HomePage);
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 });
      const pinnedIndex = titles.findIndex(el => el.textContent === 'Fixado');
      const normalIndex = titles.findIndex(el => el.textContent === 'Normal');
      expect(pinnedIndex).toBeLessThan(normalIndex);
    });
  });

  it('exibe mensagem vazia quando não há anúncios', async () => {
    api.getAnnouncements.mockResolvedValue({ ok: true, data: { results: [] } });
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Nenhum anúncio.')).toBeInTheDocument();
    });
  });
});

describe('HomePage — links "Ver todos"', () => {
  it('exibe 3 links "Ver todos →" após carregamento', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getAllByText('Ver todos →')).toHaveLength(3);
    });
  });

  it('links apontam para eventos, projetos e anúncios', async () => {
    render(HomePage);
    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: 'Ver todos →' });
      const hrefs = links.map(l => l.getAttribute('href'));
      expect(hrefs).toContain('/events');
      expect(hrefs).toContain('/projects');
      expect(hrefs).toContain('/announcements');
    });
  });
});
