<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { authStore, isAdmin } from '$lib/stores/auth';

  let events = [];
  let loading = true;
  let statusFilter = '';
  let searchQuery = '';

  let user = null;
  let admin = false;
  authStore.subscribe((u) => (user = u));
  isAdmin.subscribe((v) => (admin = v));

  onMount(() => loadEvents());

  async function loadEvents() {
    loading = true;
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    const { ok, data } = await api.getEvents(params);
    if (ok) events = Array.isArray(data) ? data : (data.results ?? []);
    loading = false;
  }

  function capacityLabel(ev) {
    if (!ev.capacity) return 'Vagas ilimitadas';
    const free = ev.capacity - (ev.confirmed_count ?? 0);
    if (free > 0) return `${free} / ${ev.capacity} vagas`;
    return 'Esgotado — Fila de espera';
  }

  function capacityClass(ev) {
    if (!ev.capacity) return 'badge-green';
    const free = ev.capacity - (ev.confirmed_count ?? 0);
    if (free > 5) return 'badge-green';
    if (free > 0) return 'badge-yellow';
    return 'badge-red';
  }

  function statusLabel(s) {
    return { upcoming: 'Próximo', ongoing: 'Em andamento', past: 'Encerrado' }[s] ?? s;
  }
</script>

<svelte:head><title>Eventos — SDSC</title></svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-gray-900">Eventos</h1>
  {#if admin}
    <a href="/admin/events/new" class="btn-primary text-sm">+ Novo Evento</a>
  {/if}
</div>

<!-- Filtros -->
<div class="flex flex-wrap gap-3 mb-6">
  <input
    type="search"
    bind:value={searchQuery}
    placeholder="Buscar evento..."
    class="input w-56"
    on:input={loadEvents}
    aria-label="Buscar evento"
  />
  <select bind:value={statusFilter} on:change={loadEvents} class="input w-44" aria-label="Filtrar por status">
    <option value="">Todos os status</option>
    <option value="upcoming">Próximos</option>
    <option value="ongoing">Em andamento</option>
    <option value="past">Encerrados</option>
  </select>
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando eventos...</p>
{:else if events.length === 0}
  <p class="text-gray-500 py-8 text-center">Nenhum evento encontrado.</p>
{:else}
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each events as ev (ev.id)}
      <a href="/events/{ev.id}" class="card hover:shadow-md transition-shadow block">
        {#if ev.image}
          <img src={ev.image} alt={ev.title} class="w-full h-36 object-cover rounded-md mb-4 -mx-0" />
        {/if}
        <div class="flex items-start justify-between gap-2 mb-2">
          <h2 class="font-semibold text-gray-900 text-base leading-tight">{ev.title}</h2>
          <span class="badge-blue flex-shrink-0">{statusLabel(ev.status)}</span>
        </div>
        <p class="text-sm text-gray-500 mb-1">
          📅 {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        <p class="text-sm text-gray-500 mb-3">📍 {ev.location}</p>
        <span class="{capacityClass(ev)}">{capacityLabel(ev)}</span>
      </a>
    {/each}
  </div>
{/if}
