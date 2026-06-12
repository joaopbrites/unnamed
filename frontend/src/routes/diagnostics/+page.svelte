<script>
  import { base } from '$app/paths';
  import { runDiagnostics, summarize } from '$lib/diagnostics';

  let apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
  let adminUsername = '';
  let adminPassword = '';

  let results = [];
  let running = false;
  let summary = null;
  let startedAt = null;

  const ICON = { pending: '○', running: '⏳', pass: '✅', fail: '❌', skip: '⏭️' };
  const COLOR = {
    pending: 'text-gray-300',
    running: 'text-blue-500',
    pass: 'text-green-600',
    fail: 'text-red-600',
    skip: 'text-yellow-600',
  };

  $: groups = results.reduce((acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  }, {});
  $: groupOrder = [...new Set(results.map((r) => r.group))];

  async function run() {
    if (running) return;
    running = true;
    summary = null;
    results = [];
    startedAt = new Date();
    const siteOrigin = typeof location !== 'undefined' ? location.origin : '';

    try {
      results = await runDiagnostics({
        baseUrl: apiBase.trim().replace(/\/$/, ''),
        siteOrigin,
        siteBase: base,
        creds: { adminUsername: adminUsername.trim(), adminPassword },
        onUpdate: (r) => {
          results = r;
        },
      });
      summary = summarize(results);
    } finally {
      running = false;
    }
  }
</script>

<svelte:head><title>Diagnóstico do sistema — SDSC</title></svelte:head>

<div class="max-w-3xl mx-auto">
  <h1 class="text-2xl font-bold text-gray-900 mb-1">Diagnóstico do sistema</h1>
  <p class="text-gray-500 text-sm mb-6">
    Testa ao vivo todas as funções da API contra o ambiente configurado abaixo (produção por padrão).
    Cria dados temporários marcados com <code>[DIAG]</code> e os remove ao final.
  </p>

  <div class="card mb-6 space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="apiBase">URL da API</label>
      <input
        id="apiBase"
        bind:value={apiBase}
        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="https://unnamed-rzrx.onrender.com/api"
      />
    </div>

    <details class="text-sm">
      <summary class="cursor-pointer text-gray-600 select-none">
        Credenciais de admin (opcional — habilita testes de admin/superuser)
      </summary>
      <div class="grid sm:grid-cols-2 gap-3 mt-3">
        <input
          bind:value={adminUsername}
          autocomplete="off"
          class="border border-gray-300 rounded-md px-3 py-2"
          placeholder="usuário admin"
        />
        <input
          bind:value={adminPassword}
          type="password"
          autocomplete="off"
          class="border border-gray-300 rounded-md px-3 py-2"
          placeholder="senha"
        />
      </div>
      <p class="text-xs text-gray-400 mt-2">
        Usadas só nesta execução; não são salvas. Sem elas, os testes de admin/superuser são pulados.
      </p>
    </details>

    <button class="btn-primary" on:click={run} disabled={running}>
      {running ? 'Executando…' : results.length ? 'Reexecutar diagnóstico' : 'Rodar diagnóstico'}
    </button>
  </div>

  {#if summary}
    <div
      class="card mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium"
      class:border-green-300={summary.fail === 0}
      class:border-red-300={summary.fail > 0}
    >
      <span class="text-green-600">✅ {summary.pass} ok</span>
      <span class="text-red-600">❌ {summary.fail} falha(s)</span>
      <span class="text-yellow-600">⏭️ {summary.skip} pulado(s)</span>
      <span class="text-gray-500">{summary.total} no total · {Math.round(summary.ms)}ms</span>
      <span class="text-gray-400 ml-auto">
        {summary.fail === 0 ? 'Tudo verde 🎉' : 'Há falhas — ver detalhes abaixo'}
      </span>
    </div>
  {/if}

  {#if results.length}
    <div class="space-y-5">
      {#each groupOrder as group}
        <div>
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{group}</h2>
          <div class="card divide-y divide-gray-100 p-0">
            {#each groups[group] as r (r.id)}
              <div class="flex items-start gap-3 px-4 py-3">
                <span class="text-lg leading-none {COLOR[r.status]}">{ICON[r.status]}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-800">{r.label}</div>
                  {#if r.detail}
                    <div class="text-xs {r.status === 'fail' ? 'text-red-600' : 'text-gray-500'} break-words">
                      {r.detail}
                    </div>
                  {/if}
                </div>
                {#if r.ms > 0}
                  <span class="text-xs text-gray-400 whitespace-nowrap">{r.ms}ms</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else if !running}
    <p class="text-sm text-gray-400 text-center py-8">
      Clique em <strong>Rodar diagnóstico</strong> para validar o sistema.
    </p>
  {/if}
</div>
