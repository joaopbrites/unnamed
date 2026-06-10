<script>
  import { goto } from '$app/navigation';

  export let value = '';
  export let placeholder = 'Buscar eventos, projetos, anúncios...';

  function handleSubmit() {
    const q = value.trim();
    if (q) goto(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleSubmit();
  }
</script>

<div class="flex gap-2">
  <input
    type="search"
    bind:value
    {placeholder}
    on:keydown={handleKeydown}
    class="input flex-1"
    aria-label="Campo de busca"
  />
  <button on:click={handleSubmit} class="btn-primary" aria-label="Buscar">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  </button>
</div>
