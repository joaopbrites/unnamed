<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore, isAdmin } from '$lib/stores/auth';
  import Chart from 'chart.js/auto';

  let summary = null;
  let pageviews = [];
  let loading = true;
  let days = 7;
  let chartCanvas;
  let chart;

  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  onMount(async () => {
    if (!admin) { await goto('/'); return; }
    await loadData();
  });

  async function loadData() {
    loading = true;
    const [sumRes, pvRes] = await Promise.all([
      api.getAnalyticsSummary(),
      api.getPageviewHistory(days),
    ]);
    if (sumRes.ok) summary = sumRes.data;
    if (pvRes.ok) {
      pageviews = Array.isArray(pvRes.data) ? pvRes.data : (pvRes.data.results ?? []);
    }
    loading = false;
    // O <canvas> só entra no DOM depois de loading virar false. Esperamos o
    // DOM atualizar (tick) antes de desenhar, senão chartCanvas fica indefinido
    // e o gráfico nunca aparece (apenas um espaço em branco).
    await tick();
    buildChart();
  }

  function buildChart() {
    if (!chartCanvas) return;
    if (chart) chart.destroy();
    const labels = pageviews.map((d) => d.day ?? d.date);
    const counts = pageviews.map((d) => d.count);
    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Visualizações por dia',
          data: counts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }
</script>

<svelte:head><title>Analytics — SDSC</title></svelte:head>

<h1 class="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando dados...</p>
{:else}
  <!-- Cards de totais -->
  {#if summary}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="card text-center">
        <p class="text-3xl font-bold text-blue-600">{summary.total_pageviews ?? 0}</p>
        <p class="text-sm text-gray-500 mt-1">Visualizações total</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-green-600">{summary.total_events ?? 0}</p>
        <p class="text-sm text-gray-500 mt-1">Eventos</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-purple-600">{summary.total_projects ?? 0}</p>
        <p class="text-sm text-gray-500 mt-1">Projetos</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-orange-500">{summary.total_announcements ?? 0}</p>
        <p class="text-sm text-gray-500 mt-1">Anúncios</p>
      </div>
    </div>
  {/if}

  <!-- Gráfico de pageviews -->
  <div class="card mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Visualizações por Dia</h2>
      <div class="flex items-center gap-2">
        <label for="days-select" class="text-sm text-gray-600">Período:</label>
        <select
          id="days-select"
          bind:value={days}
          on:change={loadData}
          class="input py-1 w-28"
        >
          <option value={7}>7 dias</option>
          <option value={14}>14 dias</option>
          <option value={30}>30 dias</option>
        </select>
      </div>
    </div>
    <canvas bind:this={chartCanvas} height="300"></canvas>
  </div>

  <!-- Tabela de dados -->
  {#if pageviews.length > 0}
    <div class="card overflow-x-auto">
      <h3 class="font-semibold text-gray-900 mb-3">Detalhe por Dia</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-2 pr-4">Data</th>
            <th class="pb-2">Visualizações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each pageviews as row}
            <tr>
              <td class="py-2 pr-4 text-gray-700">{row.day ?? row.date}</td>
              <td class="py-2 font-medium text-gray-900">{row.count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}
