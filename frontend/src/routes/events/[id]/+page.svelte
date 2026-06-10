<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore, isAdmin } from '$lib/stores/auth';
  import CommentSection from '$lib/components/CommentSection.svelte';

  let event = null;
  let loading = true;
  let user = null;
  let admin = false;
  let registration = null;
  let actionLoading = false;
  let actionMsg = '';
  let deleteConfirm = false;

  authStore.subscribe((u) => (user = u));
  isAdmin.subscribe((v) => (admin = v));

  let id;
  page.subscribe((p) => (id = p.params.id));

  onMount(async () => {
    const { ok, data } = await api.getEvent(id);
    if (ok) event = data;
    loading = false;
  });

  function capacityInfo(ev) {
    if (!ev.capacity) return { label: 'Vagas ilimitadas', cls: 'badge-green' };
    const free = ev.capacity - (ev.confirmed_count ?? 0);
    if (free > 0) return { label: `${free} vaga(s) disponível`, cls: free > 5 ? 'badge-green' : 'badge-yellow' };
    return { label: 'Esgotado — inscrição em fila de espera', cls: 'badge-red' };
  }

  async function register() {
    actionLoading = true;
    actionMsg = '';
    const { ok, data } = await api.registerEvent(id);
    actionLoading = false;
    if (ok) {
      registration = data;
      actionMsg = data.status === 'confirmed' ? 'Inscrição confirmada!' : 'Você está na fila de espera.';
      event = { ...event, confirmed_count: (event.confirmed_count ?? 0) + (data.status === 'confirmed' ? 1 : 0) };
    } else {
      actionMsg = data?.detail ?? 'Erro ao se inscrever.';
    }
  }

  async function unregister() {
    actionLoading = true;
    actionMsg = '';
    const { ok } = await api.unregisterEvent(id);
    actionLoading = false;
    if (ok) {
      registration = null;
      actionMsg = 'Inscrição cancelada.';
    }
  }

  async function deleteEvent() {
    const { ok } = await api.deleteEvent(id);
    if (ok) goto('/events');
  }
</script>

<svelte:head>
  <title>{event?.title ?? 'Evento'} — SDSC</title>
</svelte:head>

<div class="flex items-center justify-between mb-4">
  <a href="/events" class="text-sm text-blue-600 hover:underline">← Voltar para eventos</a>
  {#if admin}
    <div class="flex gap-2">
      <a href="/admin/events/{id}/edit" class="btn-secondary text-sm py-1.5">Editar</a>
      {#if !deleteConfirm}
        <button on:click={() => (deleteConfirm = true)} class="btn-danger text-sm py-1.5">Excluir</button>
      {:else}
        <span class="text-sm text-gray-600 self-center">Confirmar?</span>
        <button on:click={deleteEvent} class="btn-danger text-sm py-1.5">Sim</button>
        <button on:click={() => (deleteConfirm = false)} class="btn-secondary text-sm py-1.5">Não</button>
      {/if}
    </div>
  {/if}
</div>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando...</p>
{:else if !event}
  <p class="text-gray-500 py-8 text-center">Evento não encontrado.</p>
{:else}
  {@const ci = capacityInfo(event)}
  <div class="max-w-3xl">
    {#if event.image}
      <img src={event.image} alt={event.title} class="w-full h-56 object-cover rounded-xl mb-6" />
    {/if}

    <h1 class="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>

    <div class="flex flex-wrap gap-3 mb-4">
      <span class="badge-blue">
        {{ upcoming: 'Próximo', ongoing: 'Em andamento', past: 'Encerrado' }[event.status] ?? event.status}
      </span>
      <span class="{ci.cls}">{ci.label}</span>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
      <p>📅 {new Date(event.date).toLocaleString('pt-BR')}</p>
      <p>📍 {event.location}</p>
    </div>

    <p class="text-gray-700 mb-6 leading-relaxed">{event.description}</p>

    {#if user}
      <div class="mb-8">
        {#if !registration}
          <button on:click={register} disabled={actionLoading} class="btn-primary">
            {actionLoading ? 'Aguarde...' : 'Inscrever-se'}
          </button>
        {:else}
          <div class="flex items-center gap-4">
            <span class="{registration.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}">
              {registration.status === 'confirmed' ? 'Inscrito ✓' : 'Na fila de espera'}
            </span>
            <button on:click={unregister} disabled={actionLoading} class="btn-danger text-sm">
              Cancelar inscrição
            </button>
          </div>
        {/if}
        {#if actionMsg}
          <p class="mt-2 text-sm text-gray-700">{actionMsg}</p>
        {/if}
      </div>
    {:else}
      <p class="mb-8 text-sm text-gray-500">
        <a href="/login" class="text-blue-600 hover:underline">Faça login</a> para se inscrever.
      </p>
    {/if}

    <hr class="border-gray-200 mb-8" />
    <CommentSection contentType="events.event" objectId={id} />
  </div>
{/if}
