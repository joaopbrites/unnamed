<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';

  let projects = [];
  let loading = true;
  let statusFilter = '';
  let searchQuery = '';
  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  onMount(() => loadProjects());

  async function loadProjects() {
    loading = true;
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    const { ok, data } = await api.getProjects(params);
    if (ok) projects = Array.isArray(data) ? data : (data.results ?? []);
    loading = false;
  }

  const STATUS_LABELS = {
    planning: 'Planejamento',
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  const STATUS_BADGE = {
    planning: 'badge-blue',
    active: 'badge-green',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };
</script>

<svelte:head><title>Projetos — SDSC</title></svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-gray-900">Projetos</h1>
  {#if admin}
    <a href="{base}/admin/projects/new" class="btn-primary text-sm">+ Novo Projeto</a>
  {/if}
</div>

<!-- Filtros -->
<div class="flex flex-wrap gap-3 mb-6">
  <input
    type="search"
    bind:value={searchQuery}
    placeholder="Buscar projeto..."
    class="input w-56"
    on:input={loadProjects}
    aria-label="Buscar projeto"
  />
  <select bind:value={statusFilter} on:change={loadProjects} class="input w-44" aria-label="Filtrar por status">
    <option value="">Todos os status</option>
    <option value="planning">Planejamento</option>
    <option value="active">Ativos</option>
    <option value="completed">Concluídos</option>
    <option value="cancelled">Cancelados</option>
  </select>
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando projetos...</p>
{:else if projects.length === 0}
  <p class="text-gray-500 py-8 text-center">Nenhum projeto encontrado.</p>
{:else}
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each projects as proj (proj.id)}
      <a href="{base}/projects/{proj.id}" class="card hover:shadow-md transition-shadow block">
        {#if proj.image}
          <img src={proj.image} alt={proj.title} class="w-full h-32 object-cover rounded-md mb-4" />
        {/if}
        <div class="flex items-start justify-between gap-2 mb-2">
          <h2 class="font-semibold text-gray-900 text-base leading-tight">{proj.title}</h2>
          <span class="{STATUS_BADGE[proj.status] ?? 'badge-gray'} flex-shrink-0">
            {STATUS_LABELS[proj.status] ?? proj.status}
          </span>
        </div>
        <p class="text-sm text-gray-500 line-clamp-2 mb-3">{proj.description}</p>
        <p class="text-xs text-gray-400">
          Início: {proj.start_date ?? '—'}
          {proj.end_date ? ` · Fim: ${proj.end_date}` : ''}
        </p>
      </a>
    {/each}
  </div>
{/if}
