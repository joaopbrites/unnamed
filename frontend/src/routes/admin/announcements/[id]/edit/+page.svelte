<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';

  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  let id;
  page.subscribe((p) => (id = p.params.id));

  let form = { title: '', content: '', category: 'general', is_pinned: false };
  let saving = false;
  let loading = true;
  let errors = {};

  onMount(async () => {
    if (!admin) { goto('/'); return; }
    const { ok, data } = await api.getAnnouncement(id);
    if (ok) {
      form = {
        title: data.title ?? '',
        content: data.content ?? '',
        category: data.category ?? 'general',
        is_pinned: data.is_pinned ?? false,
      };
    }
    loading = false;
  });

  async function submit() {
    saving = true;
    errors = {};
    const { ok, data } = await api.updateAnnouncement(id, form);
    saving = false;
    if (ok) {
      goto(`/announcements/${id}`);
    } else {
      errors = data ?? {};
    }
  }
</script>

<svelte:head><title>Editar Anúncio — SDSC Admin</title></svelte:head>

<a href="/announcements/{id}" class="text-sm text-blue-600 hover:underline mb-4 block">← Voltar ao anúncio</a>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if admin}
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Editar Anúncio</h1>

  <form on:submit|preventDefault={submit} class="card max-w-2xl space-y-5">
    <div>
      <label for="title" class="label">Título *</label>
      <input id="title" type="text" bind:value={form.title} class="input" required />
      {#if errors.title}<p class="text-red-600 text-sm mt-1">{errors.title}</p>{/if}
    </div>

    <div>
      <label for="content" class="label">Conteúdo *</label>
      <textarea id="content" bind:value={form.content} class="input" rows="6" required></textarea>
      {#if errors.content}<p class="text-red-600 text-sm mt-1">{errors.content}</p>{/if}
    </div>

    <div>
      <label for="category" class="label">Categoria</label>
      <select id="category" bind:value={form.category} class="input">
        <option value="general">Geral</option>
        <option value="meeting">Reunião</option>
        <option value="event">Evento</option>
        <option value="news">Novidade</option>
        <option value="maintenance">Manutenção</option>
      </select>
    </div>

    <div class="flex items-center gap-3">
      <input id="is_pinned" type="checkbox" bind:checked={form.is_pinned} class="h-4 w-4 rounded border-gray-300 text-blue-600" />
      <label for="is_pinned" class="text-sm font-medium text-gray-700">Fixar anúncio no topo</label>
    </div>

    {#if errors.detail}
      <p class="text-red-600 text-sm">{errors.detail}</p>
    {/if}

    <div class="flex gap-3 pt-2">
      <button type="submit" disabled={saving} class="btn-primary">
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
      <a href="/announcements/{id}" class="btn-secondary">Cancelar</a>
    </div>
  </form>
{/if}
