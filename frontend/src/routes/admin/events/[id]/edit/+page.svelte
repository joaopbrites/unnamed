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

  let form = { title: '', description: '', date: '', location: '', capacity: '', status: 'upcoming' };
  let saving = false;
  let loading = true;
  let errors = {};

  onMount(async () => {
    if (!admin) { goto('/'); return; }
    const { ok, data } = await api.getEvent(id);
    if (ok) {
      form = {
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ? data.date.slice(0, 16) : '',
        location: data.location ?? '',
        capacity: data.capacity != null ? String(data.capacity) : '',
        status: data.status ?? 'upcoming',
      };
    }
    loading = false;
  });

  async function submit() {
    saving = true;
    errors = {};
    const payload = { ...form, capacity: form.capacity !== '' ? parseInt(form.capacity) : null };
    const { ok, data } = await api.updateEvent(id, payload);
    saving = false;
    if (ok) {
      goto(`/events/${id}`);
    } else {
      errors = data ?? {};
    }
  }
</script>

<svelte:head><title>Editar Evento — SDSC Admin</title></svelte:head>

<a href="/events/{id}" class="text-sm text-blue-600 hover:underline mb-4 block">← Voltar ao evento</a>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if admin}
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Editar Evento</h1>

  <form on:submit|preventDefault={submit} class="card max-w-2xl space-y-5">
    <div>
      <label for="title" class="label">Título *</label>
      <input id="title" type="text" bind:value={form.title} class="input" required />
      {#if errors.title}<p class="text-red-600 text-sm mt-1">{errors.title}</p>{/if}
    </div>

    <div>
      <label for="description" class="label">Descrição *</label>
      <textarea id="description" bind:value={form.description} class="input" rows="4" required></textarea>
      {#if errors.description}<p class="text-red-600 text-sm mt-1">{errors.description}</p>{/if}
    </div>

    <div>
      <label for="date" class="label">Data e Hora *</label>
      <input id="date" type="datetime-local" bind:value={form.date} class="input" required />
      {#if errors.date}<p class="text-red-600 text-sm mt-1">{errors.date}</p>{/if}
    </div>

    <div>
      <label for="location" class="label">Local *</label>
      <input id="location" type="text" bind:value={form.location} class="input" required />
      {#if errors.location}<p class="text-red-600 text-sm mt-1">{errors.location}</p>{/if}
    </div>

    <div>
      <label for="status" class="label">Status</label>
      <select id="status" bind:value={form.status} class="input">
        <option value="upcoming">Próximo</option>
        <option value="ongoing">Em andamento</option>
        <option value="past">Encerrado</option>
      </select>
    </div>

    <div>
      <label for="capacity" class="label">Capacidade (deixe vazio para ilimitada)</label>
      <input id="capacity" type="number" bind:value={form.capacity} class="input" min="1" />
      {#if errors.capacity}<p class="text-red-600 text-sm mt-1">{errors.capacity}</p>{/if}
    </div>

    {#if errors.detail}
      <p class="text-red-600 text-sm">{errors.detail}</p>
    {/if}

    <div class="flex gap-3 pt-2">
      <button type="submit" disabled={saving} class="btn-primary">
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
      <a href="/events/{id}" class="btn-secondary">Cancelar</a>
    </div>
  </form>
{/if}
