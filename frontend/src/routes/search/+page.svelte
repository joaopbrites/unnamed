<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';

  let query = '';
  let results = { events: [], projects: [], announcements: [] };
  let loading = false;
  let searched = false;

  page.subscribe((p) => {
    const q = p.url.searchParams.get('q') ?? '';
    if (q && q !== query) {
      query = q;
      doSearch();
    }
  });

  async function doSearch() {
    if (!query.trim()) return;
    loading = true;
    searched = false;
    const { ok, data } = await api.search(query.trim());
    if (ok) {
      results = {
        events: data.events ?? [],
        projects: data.projects ?? [],
        announcements: data.announcements ?? [],
      };
    }
    loading = false;
    searched = true;
  }

  function submit() {
    if (!query.trim()) return;
    goto(`/search?q=${encodeURIComponent(query.trim())}`);
    doSearch();
  }

  const total = (r) => r.events.length + r.projects.length + r.announcements.length;
</script>

<svelte:head><title>Busca — SDSC</title></svelte:head>

<h1 class="text-2xl font-bold text-gray-900 mb-6">Busca Global</h1>

<div class="flex gap-2 mb-8 max-w-lg">
  <input
    type="search"
    bind:value={query}
    placeholder="Buscar eventos, projetos, anúncios..."
    class="input flex-1"
    on:keydown={(e) => e.key === 'Enter' && submit()}
    aria-label="Campo de busca"
  />
  <button on:click={submit} class="btn-primary">Buscar</button>
</div>

{#if loading}
  <p class="text-gray-400 text-center py-8">Buscando...</p>
{:else if searched}
  {#if total(results) === 0}
    <p class="text-gray-500 text-center py-8">Nenhum resultado para "<strong>{query}</strong>".</p>
  {:else}
    <p class="text-sm text-gray-500 mb-6">{total(results)} resultado(s) para "<strong>{query}</strong>"</p>

    <!-- Eventos -->
    {#if results.events.length > 0}
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Eventos ({results.events.length})
        </h2>
        <div class="space-y-3">
          {#each results.events as ev (ev.id)}
            <a href="/events/{ev.id}" class="card block hover:shadow-md transition-shadow">
              <h3 class="font-medium text-gray-900">{ev.title}</h3>
              <p class="text-sm text-gray-500 mt-1">{ev.location} — {new Date(ev.date).toLocaleDateString('pt-BR')}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Projetos -->
    {#if results.projects.length > 0}
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Projetos ({results.projects.length})
        </h2>
        <div class="space-y-3">
          {#each results.projects as proj (proj.id)}
            <a href="/projects/{proj.id}" class="card block hover:shadow-md transition-shadow">
              <h3 class="font-medium text-gray-900">{proj.title}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">{proj.description}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Anúncios -->
    {#if results.announcements.length > 0}
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Anúncios ({results.announcements.length})
        </h2>
        <div class="space-y-3">
          {#each results.announcements as ann (ann.id)}
            <a href="/announcements/{ann.id}" class="card block hover:shadow-md transition-shadow">
              <h3 class="font-medium text-gray-900">{ann.title}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
{/if}
