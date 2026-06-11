<script>
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';

  let code = '';
  let loading = false;
  let error = '';

  async function handleVerify() {
    if (!code.trim()) return;
    loading = true;
    error = '';
    const { ok, data } = await api.verify2FA(code.trim());
    loading = false;
    if (ok && data.verified) {
      goto('/');
    } else {
      error = data?.detail ?? 'Código inválido. Tente novamente.';
    }
  }
</script>

<svelte:head><title>Verificação 2FA — SDSC</title></svelte:head>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="w-full max-w-sm">
    <div class="card">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔐</div>
        <h1 class="text-xl font-bold text-gray-900">Verificação em dois fatores</h1>
        <p class="text-sm text-gray-500 mt-1">
          Digite o código do seu aplicativo autenticador.
        </p>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-4 text-sm" role="alert">
          {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleVerify} class="space-y-4">
        <div>
          <label class="label text-center block" for="totp-code">Código TOTP</label>
          <input
            id="totp-code"
            type="text"
            bind:value={code}
            maxlength="6"
            placeholder="000000"
            inputmode="numeric"
            autocomplete="one-time-code"
            class="input text-center text-3xl tracking-widest font-mono"
            required
          />
        </div>
        <button type="submit" disabled={loading} class="btn-primary w-full">
          {loading ? 'Verificando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  </div>
</div>
