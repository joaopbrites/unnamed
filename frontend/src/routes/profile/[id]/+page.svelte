<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth';

  let profile = null;
  let loading = true;
  let id;
  let user = null;

  authStore.subscribe((u) => (user = u));
  page.subscribe((p) => (id = p.params.id));

  onMount(async () => {
    if (!user) { loading = false; return; }
    const { ok, data } = await api.getUserProfile(id);
    if (ok) profile = data;
    loading = false;
  });

  const STATUS_BADGE = {
    confirmed: 'badge-green',
    waitlisted: 'badge-yellow',
    cancelled: 'badge-gray',
  };
  const STATUS_LABEL = {
    confirmed: 'Confirmado',
    waitlisted: 'Fila de espera',
    cancelled: 'Cancelado',
  };
</script>

<svelte:head>
  <title>{profile?.username ?? 'Perfil'} — SDSC</title>
</svelte:head>

{#if loading}
  <p class="text-gray-400 py-8 text-center">Carregando perfil...</p>
{:else if !user}
  <p class="text-gray-500 py-8 text-center">
    <a href="/login" class="text-blue-600 hover:underline">Faça login</a> para ver perfis.
  </p>
{:else if !profile}
  <p class="text-gray-500 py-8 text-center">Perfil não encontrado.</p>
{:else}
  <div class="max-w-2xl">
    <!-- Cabeçalho do perfil -->
    <div class="card flex items-center gap-5 mb-6">
      <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
        {profile.username[0].toUpperCase()}
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">
          {profile.first_name || profile.last_name
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : profile.username}
        </h1>
        <p class="text-sm text-gray-500">@{profile.username}</p>
        {#if profile.bio}
          <p class="text-sm text-gray-600 mt-1">{profile.bio}</p>
        {/if}
        <p class="text-xs text-gray-400 mt-1">
          Membro desde {new Date(profile.date_joined).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>

    <!-- Últimas inscrições -->
    <section class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Últimas Inscrições em Eventos</h2>
      {#if profile.recent_registrations?.length === 0}
        <p class="text-gray-500 text-sm">Nenhuma inscrição recente.</p>
      {:else}
        <div class="space-y-2">
          {#each profile.recent_registrations ?? [] as reg (reg.id)}
            <div class="card flex items-center justify-between py-3">
              <a href="/events/{reg.event}" class="text-sm font-medium text-blue-700 hover:underline">
                Evento #{reg.event}
              </a>
              <span class="{STATUS_BADGE[reg.status] ?? 'badge-gray'}">
                {STATUS_LABEL[reg.status] ?? reg.status}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Últimos comentários -->
    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Últimos Comentários</h2>
      {#if profile.recent_comments?.length === 0}
        <p class="text-gray-500 text-sm">Nenhum comentário recente.</p>
      {:else}
        <div class="space-y-2">
          {#each profile.recent_comments ?? [] as c (c.id)}
            <div class="card py-3">
              <p class="text-sm text-gray-700">"{c.text}"</p>
              <p class="text-xs text-gray-400 mt-1">
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{/if}
