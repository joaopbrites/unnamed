<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { api } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';
  import CommentSection from '$lib/components/CommentSection.svelte';

  let project = null;
  let loading = true;
  let admin = false;
  let deleteConfirm = false;
  let id;

  page.subscribe((p) => (id = p.params.id));
  isAdmin.subscribe((v) => (admin = v));

  onMount(async () => {
    const { ok, data } = await api.getProject(id);
    if (ok) project = data;
    loading = false;
  });

  async function deleteProject() {
    const { ok } = await api.deleteProject(id);
    if (ok) goto(base + '/projects');
  }

  const STATUS_LABELS = {
    planning: 'Planejamento',
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  const STATUS_BADGE = {
    planning: 'badge-blue',
    active: 'badge-green',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };
</script>

<svelte:head>
  <title>{project?.title ?? 'Projeto'} — SDSC</title>
</svelte:head>

<div class="flex items-center justify-between mb-4">
  <a href="{base}/projects" class="text-sm text-blue-600 hover:underline">← Voltar para projetos</a>
  {#if admin}
    <div class="flex gap-2">
      <a href="{base}/admin/projects/{id}/edit" class="btn-secondary text-sm py-1.5">Editar</a>
      {#if !deleteConfirm}
        <button on:click={() => (deleteConfirm = true)} class="btn-danger text-sm py-1.5">Excluir</button>
      {:else}
        <span class="text-sm text-gray-600 self-center">Confirmar?</span>
        <button on:click={deleteProject} class="btn-danger text-sm py-1.5">Sim</button>
        <button on:click={() => (deleteConfirm = false)} class="btn-secondary text-sm py-1.5">Não</button>
      {/if}
    </div>
  {/if}
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if !project}
  <p class="text-gray-500 py-8 text-center">Projeto não encontrado.</p>
{:else}
  <div class="max-w-3xl">
    {#if project.image}
      <img src={project.image} alt={project.title} class="w-full h-48 object-cover rounded-xl mb-6" />
    {/if}

    <div class="flex items-center gap-3 mb-2">
      <h1 class="text-3xl font-bold text-gray-900">{project.title}</h1>
      <span class="{STATUS_BADGE[project.status] ?? 'badge-gray'}">
        {STATUS_LABELS[project.status] ?? project.status}
      </span>
    </div>

    <div class="flex gap-6 text-sm text-gray-500 mb-6">
      {#if project.start_date}
        <span>📅 Início: {project.start_date}</span>
      {/if}
      {#if project.end_date}
        <span>🏁 Fim: {project.end_date}</span>
      {/if}
    </div>

    <p class="text-gray-700 leading-relaxed mb-8">{project.description}</p>

    <hr class="border-gray-200 mb-8" />
    <CommentSection contentType="projects.project" objectId={id} />
  </div>
{/if}
