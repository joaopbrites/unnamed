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

  it('cada card é um link para a rota correta', () => {
    render(HomePage);
    expect(screen.getByRole('link', { name: /Participe das atividades/ })).toHaveAttribute('href', '/events');
    expect(screen.getByRole('link', { name: /Iniciativas da nossa/ })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /Novidades e comunicados/ })).toHaveAttribute('href', '/announcements');
  });
});

describe('HomePage — seção Sobre', () => {
  it('exibe o título "Sobre a SDSC"', () => {
    render(HomePage);
    expect(screen.getByText('Sobre a SDSC')).toBeInTheDocument();
  });

  it('exibe o parágrafo de introdução com ano de fundação', () => {
    render(HomePage);
    expect(screen.getByText(/Fundada em 1987/)).toBeInTheDocument();
  });

  it('exibe card de Missão com texto', () => {
    render(HomePage);
    expect(screen.getByText('Nossa Missão')).toBeInTheDocument();
    expect(screen.getByText(/Promover o esporte/)).toBeInTheDocument();
  });

  it('exibe card de Visão com texto', () => {
    render(HomePage);
    expect(screen.getByText('Nossa Visão')).toBeInTheDocument();
    expect(screen.getByText(/principal associação desportiva/)).toBeInTheDocument();
  });

  it('exibe card de Valores com lista', () => {
    render(HomePage);
    expect(screen.getByText('Nossos Valores')).toBeInTheDocument();
    expect(screen.getByText('Inclusão e diversidade')).toBeInTheDocument();
    expect(screen.getByText('Respeito e fair play')).toBeInTheDocument();
    expect(screen.getByText('Solidariedade comunitária')).toBeInTheDocument();
  });
});

describe('HomePage — sem skeleton', () => {
  it('não exibe skeleton de loading em nenhum momento', () => {
    const { container } = render(HomePage);
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('não exibe skeleton mesmo com API pendente', () => {
    api.getEvents.mockReturnValue(new Promise(() => {}));
    const { container } = render(HomePage);
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});

describe('HomePage — conteúdo recente (condicional)', () => {
  it('não exibe seções de recentes quando API retorna vazio', async () => {
    api.getEvents.mockResolvedValue({ ok: true, data: { results: [] } });
    api.getAnnouncements.mockResolvedValue({ ok: true, data: { results: [] } });
    api.getProjects.mockResolvedValue({ ok: true, data: { results: [] } });
    render(HomePage);
    await waitFor(() => {
      expect(screen.queryByText('Próximos Eventos')).not.toBeInTheDocument();
      expect(screen.queryByText('Projetos Recentes')).not.toBeInTheDocument();
    });
  });

  it('exibe eventos após carregamento', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Festa Junina')).toBeInTheDocument();
      expect(screen.getByText('Torneio de Futebol')).toBeInTheDocument();
    });
  });

  it('exibe projetos após carregamento', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Reforma do Campo')).toBeInTheDocument();
      expect(screen.getByText('Jardim Comunitário')).toBeInTheDocument();
    });
  });

  it('exibe anúncios após carregamento', async () => {
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

  it('exibe badge de status dos eventos', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Próximo')).toBeInTheDocument();
      expect(screen.getByText('Em andamento')).toBeInTheDocument();
    });
  });

  it('exibe badge de status dos projetos', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Planejamento')).toBeInTheDocument();
    });
  });

  it('exibe links "Ver todos →" apenas quando há conteúdo', async () => {
    render(HomePage);
    await waitFor(() => {
      expect(screen.getAllByText('Ver todos →')).toHaveLength(3);
    });
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
      const headings = screen.getAllByRole('heading', { level: 3 });
      const pinnedIdx = headings.findIndex(el => el.textContent === 'Fixado');
      const normalIdx = headings.findIndex(el => el.textContent === 'Normal');
      expect(pinnedIdx).toBeLessThan(normalIdx);
    });
  });
});
