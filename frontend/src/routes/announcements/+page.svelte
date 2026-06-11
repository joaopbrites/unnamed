<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';

  let announcements = [];
  let loading = true;
  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  const CATEGORY_LABELS = {
    meeting: 'Reunião',
    event: 'Evento',
    news: 'Novidade',
    maintenance: 'Manutenção',
    general: 'Geral',
  };
  const CATEGORY_BADGE = {
    meeting: 'badge-blue',
    event: 'badge-green',
    news: 'badge-yellow',
    maintenance: 'badge-red',
    general: 'badge-gray',
  };

  onMount(async () => {
    const { ok, data } = await api.getAnnouncements();
    if (ok) {
      const list = Array.isArray(data) ? data : (data.results ?? []);
      // Fixados primeiro, depois por data
      announcements = list.sort((a, b) => {
        if (b.is_pinned !== a.is_pinned) return b.is_pinned - a.is_pinned;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    loading = false;
  });
</script>

<svelte:head><title>Anúncios — SDSC</title></svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-gray-900">Anúncios</h1>
  {#if admin}
    <a href="/admin/announcements/new" class="btn-primary text-sm">+ Novo Anúncio</a>
  {/if}
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando anúncios...</p>
{:else if announcements.length === 0}
  <p class="text-gray-500 py-8 text-center">Nenhum anúncio no momento.</p>
{:else}
  <div class="space-y-4">
    {#each announcements as ann (ann.id)}
      <a
        href="/announcements/{ann.id}"
        class="card block hover:shadow-md transition-shadow {ann.is_pinned ? 'border-l-4 border-blue-400' : ''}"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              {#if ann.is_pinned}
                <span class="text-blue-500 text-sm">📌</span>
              {/if}
              <h2 class="font-semibold text-gray-900 text-base">{ann.title}</h2>
            </div>
            <p class="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
            <p class="text-xs text-gray-400 mt-2">
              {new Date(ann.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span class="{CATEGORY_BADGE[ann.category] ?? 'badge-gray'} flex-shrink-0">
            {CATEGORY_LABELS[ann.category] ?? ann.category}
          </span>
        </div>
      </a>
    {/each}
  </div>
{/if}
