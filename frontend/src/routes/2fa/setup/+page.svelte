<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth';
  import QRCode from 'qrcode';

  let qrDataUrl = '';
  let secret = '';
  let code = '';
  let step = 'setup'; // 'setup' | 'confirm' | 'done'
  let loading = false;
  let error = '';
  let user = null;

  authStore.subscribe((u) => (user = u));

  onMount(async () => {
    if (!user) { goto('/login'); return; }
    await startSetup();
  });

  async function startSetup() {
    loading = true;
    const { ok, data } = await api.setup2FA();
    loading = false;
    if (ok) {
      secret = data.secret;
      qrDataUrl = await QRCode.toDataURL(data.otpauth_uri);
    } else {
      error = 'Erro ao iniciar configuração do 2FA.';
    }
  }

  async function confirmSetup() {
    if (!code.trim()) return;
    loading = true;
    error = '';
    const { ok, data } = await api.confirm2FA(code.trim());
    loading = false;
    if (ok) {
      step = 'done';
    } else {
      error = data?.detail ?? 'Código inválido.';
    }
  }
</script>

<svelte:head><title>Configurar 2FA — SDSC</title></svelte:head>

<div class="max-w-md mx-auto">
  <h1 class="text-2xl font-bold text-gray-900 mb-2">Autenticação em Dois Fatores</h1>
  <p class="text-gray-500 text-sm mb-6">Configure o 2FA para aumentar a segurança da sua conta.</p>

  {#if step === 'done'}
    <div class="card text-center py-8">
      <div class="text-5xl mb-4">✅</div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">2FA ativado com sucesso!</h2>
      <p class="text-sm text-gray-500 mb-4">A partir de agora, você precisará do código a cada login.</p>
      <button on:click={() => goto('/')} class="btn-primary">Ir para a página inicial</button>
    </div>
  {:else}
    <div class="card space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm" role="alert">
          {error}
        </div>
      {/if}

      <!-- Passo 1: QR Code -->
      <div>
        <h2 class="font-semibold text-gray-900 mb-1">1. Escaneie o QR Code</h2>
        <p class="text-sm text-gray-500 mb-3">
          Abra o Google Authenticator ou Authy e escaneie o código abaixo.
        </p>
        {#if loading}
          <div class="w-44 h-44 bg-gray-100 rounded-md flex items-center justify-center">
            <span class="text-gray-400 text-sm">Gerando...</span>
          </div>
        {:else if qrDataUrl}
          <img src={qrDataUrl} alt="QR Code para 2FA" class="w-44 h-44 border border-gray-200 rounded-md" />
        {/if}
      </div>

      <!-- Chave secreta manual -->
      {#if secret}
        <div>
          <p class="text-sm text-gray-500 mb-1">Ou insira a chave manualmente:</p>
          <code class="block bg-gray-100 rounded px-3 py-2 text-sm font-mono break-all">{secret}</code>
        </div>
      {/if}

      <!-- Passo 2: Confirmação -->
      <div>
        <h2 class="font-semibold text-gray-900 mb-1">2. Confirme o código gerado</h2>
        <p class="text-sm text-gray-500 mb-3">Digite o código de 6 dígitos do seu aplicativo.</p>
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={code}
            placeholder="000000"
            maxlength="6"
            inputmode="numeric"
            class="input text-center text-xl tracking-widest w-36"
            on:keydown={(e) => e.key === 'Enter' && confirmSetup()}
          />
          <button on:click={confirmSetup} disabled={loading || !code.trim()} class="btn-primary">
            {loading ? 'Verificando...' : 'Ativar 2FA'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
