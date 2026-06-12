import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    getAnalyticsSummary: vi.fn(),
    getPageviewHistory: vi.fn(),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/auth', () => {
  const { readable } = require('svelte/store');
  return {
    authStore: { subscribe: (fn) => { fn({ id: 1, username: 'admin', is_staff: true }); return () => {}; } },
    isLoggedIn: readable(true),
    isAdmin: readable(true),
  };
});
vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
}));

import AnalyticsPage from './+page.svelte';
import { api } from '$lib/api';
import Chart from 'chart.js/auto';

const fakeSummary = {
  total_pageviews: 450,
  total_events: 12,
  total_projects: 5,
  total_announcements: 8,
};
const fakePageviews = [
  { day: '2026-05-25', count: 30 },
  { day: '2026-05-26', count: 45 },
  { day: '2026-05-27', count: 20 },
];

beforeEach(() => {
  api.getAnalyticsSummary.mockResolvedValue({ ok: true, data: fakeSummary });
  api.getPageviewHistory.mockResolvedValue({ ok: true, data: fakePageviews });
});

describe('AnalyticsPage', () => {
  it('renderiza o título da página', async () => {
    render(AnalyticsPage);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('exibe cards com totais corretos', async () => {
    render(AnalyticsPage);
    await waitFor(() => {
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('exibe labels dos cards de totais', async () => {
    render(AnalyticsPage);
    await waitFor(() => {
      expect(screen.getByText('Visualizações total')).toBeInTheDocument();
      expect(screen.getByText('Eventos')).toBeInTheDocument();
      expect(screen.getByText('Projetos')).toBeInTheDocument();
      expect(screen.getByText('Anúncios')).toBeInTheDocument();
    });
  });

  it('exibe tabela com dados de pageviews', async () => {
    render(AnalyticsPage);
    await waitFor(() => {
      expect(screen.getByText('2026-05-25')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('tem seletor de período', async () => {
    render(AnalyticsPage);
    await waitFor(() => {
      expect(screen.getByLabelText('Período:')).toBeInTheDocument();
    });
  });

  it('recarrega dados ao mudar período', async () => {
    const user = userEvent.setup();
    render(AnalyticsPage);
    await waitFor(() => screen.getByText('450'));

    const select = screen.getByLabelText('Período:');
    await user.selectOptions(select, '30');

    await waitFor(() => {
      expect(api.getPageviewHistory).toHaveBeenCalledWith(30);
    });
  });

  it('chama api.getAnalyticsSummary no mount', async () => {
    render(AnalyticsPage);
    await waitFor(() => {
      expect(api.getAnalyticsSummary).toHaveBeenCalled();
    });
  });

  it('desenha o gráfico de linha depois que os dados carregam', async () => {
    Chart.mockClear();
    render(AnalyticsPage);
    // regressão: o canvas só existe após loading=false; o gráfico precisa ser
    // criado depois disso, senão fica um espaço em branco.
    await waitFor(() => {
      expect(Chart).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'line' }),
      );
    });
  });
});
