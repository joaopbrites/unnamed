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

  let form = { title: '', description: '', start_date: '', end_date: '', status: 'planning' };
  let saving = false;
  let loading = true;
  let errors = {};

  onMount(async () => {
    if (!admin) { goto('/'); return; }
    const { ok, data } = await api.getProject(id);
    if (ok) {
      form = {
        title: data.title ?? '',
        description: data.description ?? '',
        start_date: data.start_date ?? '',
        end_date: data.end_date ?? '',
        status: data.status ?? 'planning',
      };
    }
    loading = false;
  });

  async function submit() {
    saving = true;
    errors = {};
    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    const { ok, data } = await api.updateProject(id, payload);
    saving = false;
    if (ok) {
      goto(`/projects/${id}`);
    } else {
      errors = data ?? {};
    }
  }
</script>

<svelte:head><title>Editar Projeto — SDSC Admin</title></svelte:head>

<a href="/projects/{id}" class="text-sm text-blue-600 hover:underline mb-4 block">← Voltar ao projeto</a>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if admin}
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Editar Projeto</h1>

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
      <label for="status" class="label">Status</label>
      <select id="status" bind:value={form.status} class="input">
        <option value="planning">Planejamento</option>
        <option value="active">Ativo</option>
        <option value="completed">Concluído</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>

    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label for="start_date" class="label">Data de Início</label>
        <input id="start_date" type="date" bind:value={form.start_date} class="input" />
        {#if errors.start_date}<p class="text-red-600 text-sm mt-1">{errors.start_date}</p>{/if}
      </div>
      <div>
        <label for="end_date" class="label">Data de Término</label>
        <input id="end_date" type="date" bind:value={form.end_date} class="input" />
        {#if errors.end_date}<p class="text-red-600 text-sm mt-1">{errors.end_date}</p>{/if}
      </div>
    </div>

    {#if errors.detail}
      <p class="text-red-600 text-sm">{errors.detail}</p>
    {/if}

    <div class="flex gap-3 pt-2">
      <button type="submit" disabled={saving} class="btn-primary">
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
      <a href="/projects/{id}" class="btn-secondary">Cancelar</a>
    </div>
  </form>
{/if}
