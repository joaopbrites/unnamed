<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore, isSuperuser } from '$lib/stores/auth';

  let superuser = false;
  let currentUserId = null;
  isSuperuser.subscribe((v) => (superuser = v));
  authStore.subscribe((u) => (currentUserId = u?.id ?? null));

  let users = [];
  let loading = true;
  let saving = {};
  let feedback = {};

  onMount(async () => {
    if (!superuser) { goto(`${base}/`); return; }
    const { ok, data } = await api.getUsers();
    if (ok) users = data;
    loading = false;
  });

  async function toggle(user, field) {
    if (user.id === currentUserId) {
      feedback[user.id] = { ok: false, msg: 'Não é possível alterar as próprias permissões.' };
      return;
    }
    saving[user.id] = true;
    const { ok, data } = await api.updateUserRole(user.id, { [field]: !user[field] });
    saving[user.id] = false;
    if (ok) {
      users = users.map((u) => (u.id === user.id ? { ...u, ...data } : u));
      feedback[user.id] = { ok: true, msg: 'Salvo.' };
    } else {
      feedback[user.id] = { ok: false, msg: data?.detail ?? 'Erro ao salvar.' };
    }
    setTimeout(() => { feedback[user.id] = null; }, 3000);
  }

  function fmtDate(s) {
    return new Date(s).toLocaleDateString('pt-BR');
  }
</script>

<svelte:head><title>Usuários — Admin SDSC</title></svelte:head>

{#if superuser}
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
      <p class="text-sm text-gray-500 mt-1">Gerencie permissões de membro, admin e superusuário.</p>
    </div>
    <a href="{base}/admin" class="btn-secondary text-sm">← Painel Admin</a>
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each [1,2,3,4] as _}
        <div class="card h-16 animate-pulse bg-gray-100"></div>
      {/each}
    </div>
  {:else if users.length === 0}
    <p class="text-gray-500 text-sm">Nenhum usuário encontrado.</p>
  {:else}
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
            <th class="px-4 py-3">Usuário</th>
            <th class="px-4 py-3">E-mail</th>
            <th class="px-4 py-3">Cadastro</th>
            <th class="px-4 py-3 text-center">Membro</th>
            <th class="px-4 py-3 text-center">Admin</th>
            <th class="px-4 py-3 text-center">Superusuário</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each users as user (user.id)}
            {@const isSelf = user.id === currentUserId}
            <tr class="hover:bg-gray-50 transition-colors {isSelf ? 'bg-blue-50' : ''}">
              <td class="px-4 py-3 font-medium text-gray-900">
                {user.username}
                {#if isSelf}
                  <span class="badge-blue ml-1">você</span>
                {/if}
                {#if user.is_superuser}
                  <span class="badge-yellow ml-1">super</span>
                {:else if user.is_staff}
                  <span class="badge-green ml-1">admin</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-500">{user.email || '—'}</td>
              <td class="px-4 py-3 text-gray-400">{fmtDate(user.date_joined)}</td>

              {#each ['is_member', 'is_staff', 'is_superuser'] as field}
                <td class="px-4 py-3 text-center">
                  <button
                    type="button"
                    on:click={() => toggle(user, field)}
                    disabled={saving[user.id] || isSelf}
                    aria-label="Alternar {field} de {user.username}"
                    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                      {user[field] ? 'bg-blue-600' : 'bg-gray-300'}
                      {isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}"
                  >
                    <span
                      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                        {user[field] ? 'translate-x-4' : 'translate-x-0.5'}"
                    ></span>
                  </button>
                </td>
              {/each}
            </tr>
            {#if feedback[user.id]}
              <tr>
                <td colspan="6" class="px-4 py-1.5 text-xs {feedback[user.id].ok ? 'text-green-600' : 'text-red-600'}">
                  {feedback[user.id].msg}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-xs text-gray-400">
      Legenda: <strong>Membro</strong> — pode comentar e se inscrever em eventos.
      <strong>Admin</strong> — pode criar e editar conteúdo.
      <strong>Superusuário</strong> — acesso total, incluindo esta tela.
    </p>
  {/if}
{/if}
