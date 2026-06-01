<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';

  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  let form = { title: '', content: '', category: 'general', is_pinned: false };
  let saving = false;
  let errors = {};

  onMount(() => {
    if (!admin) goto('/');
  });

  async function submit() {
    saving = true;
    errors = {};
    const { ok, data } = await api.createAnnouncement(form);
    saving = false;
    if (ok) {
      goto(`/announcements/${data.id}`);
    } else {
      errors = data ?? {};
    }
  }
</script>

<svelte:head><title>Novo Anúncio — SDSC Admin</title></svelte:head>

<a href="/admin" class="text-sm text-blue-600 hover:underline mb-4 block">← Painel Admin</a>

{#if admin}
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Novo Anúncio</h1>

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
        {saving ? 'Salvando...' : 'Publicar Anúncio'}
      </button>
      <a href="/admin" class="btn-secondary">Cancelar</a>
    </div>
  </form>
{/if}
