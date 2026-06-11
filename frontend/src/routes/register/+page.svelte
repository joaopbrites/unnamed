<script>
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';

  let form = { username: '', email: '', password: '', first_name: '', last_name: '' };
  let loading = false;
  let errors = {};
  let success = false;

  async function handleSubmit() {
    loading = true;
    errors = {};
    const { ok, data } = await api.register(form);
    loading = false;
    if (ok) {
      success = true;
      setTimeout(() => goto('/login'), 2000);
    } else {
      errors = data ?? {};
    }
  }

  function fieldError(field) {
    const e = errors[field];
    return Array.isArray(e) ? e[0] : (e ?? '');
  }
</script>

<svelte:head><title>Cadastro — SDSC</title></svelte:head>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="w-full max-w-sm">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">Criar Conta</h1>

      {#if success}
        <div class="bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3 text-sm text-center" role="status">
          Conta criada! Redirecionando para o login...
        </div>
      {:else}
        {#if errors.detail}
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-4 text-sm" role="alert">
            {errors.detail}
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="first_name">Nome</label>
              <input id="first_name" type="text" bind:value={form.first_name} class="input" />
              {#if fieldError('first_name')}
                <p class="text-xs text-red-600 mt-1">{fieldError('first_name')}</p>
              {/if}
            </div>
            <div>
              <label class="label" for="last_name">Sobrenome</label>
              <input id="last_name" type="text" bind:value={form.last_name} class="input" />
              {#if fieldError('last_name')}
                <p class="text-xs text-red-600 mt-1">{fieldError('last_name')}</p>
              {/if}
            </div>
          </div>

          <div>
            <label class="label" for="username">Usuário *</label>
            <input id="username" type="text" bind:value={form.username} class="input" autocomplete="username" required />
            {#if fieldError('username')}
              <p class="text-xs text-red-600 mt-1">{fieldError('username')}</p>
            {/if}
          </div>

          <div>
            <label class="label" for="email">E-mail</label>
            <input id="email" type="email" bind:value={form.email} class="input" autocomplete="email" />
            {#if fieldError('email')}
              <p class="text-xs text-red-600 mt-1">{fieldError('email')}</p>
            {/if}
          </div>

          <div>
            <label class="label" for="password">Senha *</label>
            <input id="password" type="password" bind:value={form.password} class="input" autocomplete="new-password" required />
            {#if fieldError('password')}
              <p class="text-xs text-red-600 mt-1">{fieldError('password')}</p>
            {/if}
          </div>

          <button type="submit" disabled={loading} class="btn-primary w-full">
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <p class="text-sm text-center text-gray-500 mt-4">
          Já tem conta?
          <a href="/login" class="text-blue-600 hover:underline">Entrar</a>
        </p>
      {/if}
    </div>
  </div>
</div>
