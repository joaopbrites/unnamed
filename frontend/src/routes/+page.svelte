<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { api } from '$lib/api';

  let events = [];
  let announcements = [];
  let projects = [];
  let loading = true;

  onMount(async () => {
    const [evRes, anRes, prRes] = await Promise.all([
      api.getEvents({ status: 'upcoming', ordering: 'date' }),
      api.getAnnouncements(),
      api.getProjects({ ordering: '-created_at' }),
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
    if (prRes.ok) {
      const d = prRes.data;
      projects = (Array.isArray(d) ? d : (d.results ?? [])).slice(0, 3);
    }
    loading = false;
  });

  function fmtDate(s) {
    return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const EV_STATUS = { upcoming: 'Próximo', ongoing: 'Em andamento', past: 'Encerrado' };
  const EV_BADGE  = { upcoming: 'badge-blue', ongoing: 'badge-green', past: 'badge-gray' };
  const PR_STATUS = { planning: 'Planejamento', active: 'Ativo', completed: 'Concluído', cancelled: 'Cancelado' };
  const PR_BADGE  = { planning: 'badge-yellow', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
</script>

<svelte:head><title>Início — SDSC</title></svelte:head>

<!-- Hero: quebra o padding do layout para imagem full-width -->
<section
  class="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 h-96 bg-cover bg-center flex items-center justify-center"
  style="background-image: url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1920&q=80')"
>
  <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40"></div>
  <div class="relative z-10 text-center px-4 max-w-2xl">
    <h1 class="text-4xl md:text-5xl font-bold text-white drop-shadow mb-4">
      Sociedade Desportiva São Caetano
    </h1>
    <p class="text-lg text-white/90 mb-8">
      Associação de bairro dedicada ao esporte, cultura e comunidade.
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="{base}/events" class="btn-primary px-6 py-3 text-base">Ver Eventos</a>
      <a href="{base}/projects" class="btn px-6 py-3 text-base bg-white/20 text-white border border-white/50 hover:bg-white/30 focus:ring-white">
        Nossos Projetos
      </a>
    </div>
  </div>
</section>

<!-- Conteúdo -->
{#if loading}
  <div class="mt-12 grid md:grid-cols-3 gap-8">
    {#each [1, 2, 3] as _}
      <div class="space-y-3">
        <div class="h-5 bg-gray-200 rounded animate-pulse w-40"></div>
        {#each [1, 2, 3] as __}
          <div class="card space-y-2">
            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
            <div class="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
{:else}
  <div class="mt-12 grid md:grid-cols-3 gap-8">

    <!-- Próximos Eventos -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Próximos Eventos</h2>
        <a href="{base}/events" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
      </div>
      {#if events.length === 0}
        <p class="text-gray-500 text-sm">Nenhum evento próximo.</p>
      {:else}
        <div class="space-y-3">
          {#each events as ev (ev.id)}
            <a href="{base}/events/{ev.id}" class="card block hover:shadow-md transition-shadow group">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {ev.title}
                </h3>
                <span class="{EV_BADGE[ev.status] ?? 'badge-gray'} shrink-0">
                  {EV_STATUS[ev.status] ?? ev.status}
                </span>
              </div>
              <p class="text-xs text-gray-500">{fmtDate(ev.date)}</p>
              <p class="text-xs text-gray-400 truncate">{ev.location}</p>
            </a>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Projetos Recentes -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Projetos Recentes</h2>
        <a href="{base}/projects" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
      </div>
      {#if projects.length === 0}
        <p class="text-gray-500 text-sm">Nenhum projeto cadastrado.</p>
      {:else}
        <div class="space-y-3">
          {#each projects as pr (pr.id)}
            <a href="{base}/projects/{pr.id}" class="card block hover:shadow-md transition-shadow group">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {pr.title}
                </h3>
                <span class="{PR_BADGE[pr.status] ?? 'badge-gray'} shrink-0">
                  {PR_STATUS[pr.status] ?? pr.status}
                </span>
              </div>
              {#if pr.start_date}
                <p class="text-xs text-gray-500">Início: {fmtDate(pr.start_date)}</p>
              {/if}
              <p class="text-xs text-gray-400 line-clamp-2">{pr.description}</p>
            </a>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Anúncios -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Anúncios</h2>
        <a href="{base}/announcements" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
      </div>
      {#if announcements.length === 0}
        <p class="text-gray-500 text-sm">Nenhum anúncio.</p>
      {:else}
        <div class="space-y-3">
          {#each announcements as ann (ann.id)}
            <a href="{base}/announcements/{ann.id}" class="card block hover:shadow-md transition-shadow group">
              {#if ann.is_pinned}
                <span class="badge-blue mb-1 inline-block">📌 Fixado</span>
              {/if}
              <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {ann.title}
              </h3>
              <p class="text-xs text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
            </a>
          {/each}
        </div>
      {/if}
    </section>

  </div>
{/if}
