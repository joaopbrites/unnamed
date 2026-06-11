<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';
  import CommentSection from '$lib/components/CommentSection.svelte';

  let announcement = null;
  let loading = true;
  let admin = false;
  let deleteConfirm = false;
  let id;

  page.subscribe((p) => (id = p.params.id));
  isAdmin.subscribe((v) => (admin = v));

  onMount(async () => {
    const { ok, data } = await api.getAnnouncement(id);
    if (ok) announcement = data;
    loading = false;
  });

  async function deleteAnnouncement() {
    const { ok } = await api.deleteAnnouncement(id);
    if (ok) goto('/announcements');
  }

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
</script>

<svelte:head>
  <title>{announcement?.title ?? 'Anúncio'} — SDSC</title>
</svelte:head>

<div class="flex items-center justify-between mb-4">
  <a href="/announcements" class="text-sm text-blue-600 hover:underline">← Voltar para anúncios</a>
  {#if admin}
    <div class="flex gap-2">
      <a href="/admin/announcements/{id}/edit" class="btn-secondary text-sm py-1.5">Editar</a>
      {#if !deleteConfirm}
        <button on:click={() => (deleteConfirm = true)} class="btn-danger text-sm py-1.5">Excluir</button>
      {:else}
        <span class="text-sm text-gray-600 self-center">Confirmar?</span>
        <button on:click={deleteAnnouncement} class="btn-danger text-sm py-1.5">Sim</button>
        <button on:click={() => (deleteConfirm = false)} class="btn-secondary text-sm py-1.5">Não</button>
      {/if}
    </div>
  {/if}
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if !announcement}
  <p class="text-gray-500 py-8 text-center">Anúncio não encontrado.</p>
{:else}
  <div class="max-w-3xl">
    <div class="flex items-center gap-3 mb-2">
      {#if announcement.is_pinned}
        <span class="text-blue-500">📌</span>
      {/if}
      <h1 class="text-3xl font-bold text-gray-900">{announcement.title}</h1>
    </div>

    <div class="flex items-center gap-3 mb-6">
      <span class="{CATEGORY_BADGE[announcement.category] ?? 'badge-gray'}">
        {CATEGORY_LABELS[announcement.category] ?? announcement.category}
      </span>
      <span class="text-sm text-gray-400">
        {new Date(announcement.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
        })}
      </span>
    </div>

    <div class="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-8 whitespace-pre-line">
      {announcement.content}
    </div>

    <hr class="border-gray-200 mb-8" />
    <CommentSection contentType="announcements.announcement" objectId={id} />
  </div>
{/if}
