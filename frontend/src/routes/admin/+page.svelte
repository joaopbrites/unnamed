<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAdmin } from '$lib/stores/auth';

  let admin = false;
  isAdmin.subscribe((v) => (admin = v));

  onMount(() => {
    if (!admin) goto('/');
  });
</script>

<svelte:head><title>Administração — SDSC</title></svelte:head>

{#if admin}
  <h1 class="text-2xl font-bold text-gray-900 mb-2">Painel de Administração</h1>
  <p class="text-gray-500 text-sm mb-8">Gerencie o conteúdo do site da Sociedade Desportiva São Caetano.</p>

  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Eventos</h2>
      <p class="text-sm text-gray-500 mb-4">Criar e editar eventos da associação.</p>
      <div class="flex flex-col gap-2">
        <a href="/admin/events/new" class="btn-primary text-sm text-center">+ Novo Evento</a>
        <a href="/events" class="btn-secondary text-sm text-center">Ver Lista</a>
      </div>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Projetos</h2>
      <p class="text-sm text-gray-500 mb-4">Gerenciar projetos em andamento.</p>
      <div class="flex flex-col gap-2">
        <a href="/admin/projects/new" class="btn-primary text-sm text-center">+ Novo Projeto</a>
        <a href="/projects" class="btn-secondary text-sm text-center">Ver Lista</a>
      </div>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Anúncios</h2>
      <p class="text-sm text-gray-500 mb-4">Publicar avisos e notas para o bairro.</p>
      <div class="flex flex-col gap-2">
        <a href="/admin/announcements/new" class="btn-primary text-sm text-center">+ Novo Anúncio</a>
        <a href="/announcements" class="btn-secondary text-sm text-center">Ver Lista</a>
      </div>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Analytics</h2>
      <p class="text-sm text-gray-500 mb-4">Visualizações de página e estatísticas.</p>
      <a href="/analytics" class="btn-secondary text-sm text-center block">Ver Analytics</a>
    </div>
  </div>
{/if}
