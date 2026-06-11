<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { api } from '$lib/api';

  let events = [];
  let announcements = [];
  let loading = true;

  onMount(async () => {
    const [evRes, anRes] = await Promise.all([
      api.getEvents({ status: 'upcoming', ordering: 'date' }),
      api.getAnnouncements(),
    ]);
    if (evRes.ok) {
      const d = evRes.data;
      events = (Array.isArray(d) ? d : (d.results ?? [])).slice(0, 3);
    }
    if (anRes.ok) {
      const d = anRes.data;
      const all = Array.isArray(d) ? d : (d.results ?? []);
      announcements = all.sort((a, b) => b.is_pinned - a.is_pinned).slice(0, 3);
    }
    loading = false;
  });
</script>

<svelte:head><title>Início — SDSC</title></svelte:head>

<!-- Hero -->
<section class="text-center py-12">
  <h1 class="text-4xl font-bold text-gray-900 mb-4">Sociedade Desportiva São Caetano</h1>
  <p class="text-lg text-gray-600 max-w-xl mx-auto">
    Associação de bairro dedicada ao esporte, cultura e comunidade.
  </p>
  <div class="mt-6 flex justify-center gap-4">
    <a href="{base}/events" class="btn-primary">Ver Eventos</a>
    <a href="{base}/projects" class="btn-secondary">Nossos Projetos</a>
  </div>
</section>

{#if loading}
  <p class="text-center text-gray-400 py-8">Carregando...</p>
{:else}
  <div class="grid md:grid-cols-2 gap-8 mt-8">
    <!-- Próximos eventos -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Próximos Eventos</h2>
        <a href="{base}/events" class="text-sm text-blue-600 hover:underline">Ver todos</a>
      </div>
      {#if events.length === 0}
        <p class="text-gray-500 text-sm">Nenhum evento próximo.</p>
      {:else}
        <div class="space-y-3">
          {#each events as ev (ev.id)}
            <a href="{base}/events/{ev.id}" class="card block hover:shadow-md transition-shadow">
              <h3 class="font-medium text-gray-900">{ev.title}</h3>
              <p class="text-sm text-gray-500 mt-1">
                {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                — {ev.location}
              </p>
            </a>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Últimos anúncios -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Anúncios</h2>
        <a href="{base}/announcements" class="text-sm text-blue-600 hover:underline">Ver todos</a>
      </div>
      {#if announcements.length === 0}
        <p class="text-gray-500 text-sm">Nenhum anúncio.</p>
      {:else}
        <div class="space-y-3">
          {#each announcements as ann (ann.id)}
            <a href="{base}/announcements/{ann.id}" class="card block hover:shadow-md transition-shadow">
              {#if ann.is_pinned}
                <span class="badge-blue mb-1">📌 Fixado</span>
              {/if}
              <h3 class="font-medium text-gray-900">{ann.title}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{/if}
