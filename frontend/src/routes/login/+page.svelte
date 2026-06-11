<script>
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { api } from '$lib/api';

  let username = '';
  let password = '';
  let totpCode = '';
  let needsTotp = false;
  let loading = false;
  let error = '';

  async function handleLogin() {
    if (!username.trim() || !password) return;
    loading = true;
    error = '';

    const result = await authStore.login(username.trim(), password);
    loading = false;

    if (!result.ok) {
      error = result.data?.detail ?? 'Usuário ou senha inválidos.';
      return;
    }

    // Verificar se o usuário tem 2FA ativo
    const { ok, data } = await api.me();
    if (ok && data?.totp_enabled) {
      needsTotp = true;
    } else {
      goto('/');
    }
  }

  async function handleTotp() {
    if (!totpCode.trim()) return;
    loading = true;
    error = '';
    const { ok, data } = await api.verify2FA(totpCode.trim());
    loading = false;
    if (ok && data.verified) {
      goto('/');
    } else {
      error = data?.detail ?? 'Código inválido.';
    }
  }
</script>

<svelte:head><title>Entrar — SDSC</title></svelte:head>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="w-full max-w-sm">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">
        {needsTotp ? 'Autenticação em dois fatores' : 'Entrar'}
      </h1>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-4 text-sm" role="alert">
          {error}
        </div>
      {/if}

      {#if !needsTotp}
        <form on:submit|preventDefault={handleLogin} class="space-y-4">
          <div>
            <label class="label" for="username">Usuário</label>
            <input
              id="username"
              type="text"
              bind:value={username}
              class="input"
              autocomplete="username"
              required
            />
          </div>
          <div>
            <label class="label" for="password">Senha</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              class="input"
              autocomplete="current-password"
              required
            />
          </div>
          <button type="submit" disabled={loading} class="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p class="text-sm text-center text-gray-500 mt-4">
          Não tem conta?
          <a href="/register" class="text-blue-600 hover:underline">Cadastre-se</a>
        </p>
      {:else}
        <form on:submit|preventDefault={handleTotp} class="space-y-4">
          <p class="text-sm text-gray-600 text-center mb-2">
            Digite o código do seu aplicativo autenticador.
          </p>
          <div>
            <label class="label" for="totp">Código TOTP</label>
            <input
              id="totp"
              type="text"
              bind:value={totpCode}
              class="input text-center text-2xl tracking-widest"
              maxlength="6"
              placeholder="000000"
              autocomplete="one-time-code"
              inputmode="numeric"
              required
            />
          </div>
          <button type="submit" disabled={loading} class="btn-primary w-full">
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
