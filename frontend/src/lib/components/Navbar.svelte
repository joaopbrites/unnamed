<script>
  import { authStore, isLoggedIn, isAdmin } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import SearchBar from './SearchBar.svelte';
  import NotificationBell from './NotificationBell.svelte';

  let mobileOpen = false;

  function logout() {
    authStore.logout();
    goto(base + '/login');
  }
</script>

<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="{base}/" class="flex items-center gap-2 font-bold text-blue-700 text-lg flex-shrink-0">
        ⚽ SDSC
      </a>

      <!-- Search bar (desktop) -->
      <div class="hidden md:block flex-1 max-w-sm mx-6">
        <SearchBar />
      </div>

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-6">
        <a href="{base}/events" class="text-sm text-gray-600 hover:text-blue-700 font-medium">Eventos</a>
        <a href="{base}/projects" class="text-sm text-gray-600 hover:text-blue-700 font-medium">Projetos</a>
        <a href="{base}/announcements" class="text-sm text-gray-600 hover:text-blue-700 font-medium">Anúncios</a>

        {#if $isAdmin}
          <a href="{base}/analytics" class="text-sm text-gray-600 hover:text-blue-700 font-medium">Analytics</a>
          <a href="{base}/admin" class="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md font-medium">Admin</a>
        {/if}

        {#if $isLoggedIn}
          <NotificationBell />
          <div class="flex items-center gap-3">
            <a href="{base}/profile/{$authStore?.id}" class="text-sm text-gray-600 hover:text-blue-700">
              {$authStore?.username}
            </a>
            <button on:click={logout} class="btn-secondary text-sm py-1.5">Sair</button>
          </div>
        {:else}
          <a href="{base}/login" class="btn-primary text-sm py-1.5">Entrar</a>
          <a href="{base}/register" class="btn-secondary text-sm py-1.5">Cadastrar</a>
        {/if}
      </div>

      <!-- Mobile menu button -->
      <button
        class="md:hidden p-2 text-gray-600"
        on:click={() => (mobileOpen = !mobileOpen)}
        aria-label="Menu mobile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>
    </div>

    <!-- Mobile search -->
    {#if mobileOpen}
      <div class="md:hidden pb-4 space-y-3">
        <SearchBar />
        <div class="flex flex-col gap-2">
          <a href="{base}/events" class="text-sm text-gray-700 py-2 border-b border-gray-100">Eventos</a>
          <a href="{base}/projects" class="text-sm text-gray-700 py-2 border-b border-gray-100">Projetos</a>
          <a href="{base}/announcements" class="text-sm text-gray-700 py-2 border-b border-gray-100">Anúncios</a>
          {#if $isAdmin}
            <a href="{base}/analytics" class="text-sm text-gray-700 py-2 border-b border-gray-100">Analytics</a>
            <a href="{base}/admin" class="text-sm text-blue-700 font-medium py-2 border-b border-gray-100">Admin</a>
          {/if}
          {#if $isLoggedIn}
            <button on:click={logout} class="text-sm text-left text-red-600 py-2">Sair</button>
          {:else}
            <a href="{base}/login" class="text-sm text-blue-700 py-2">Entrar</a>
            <a href="{base}/register" class="text-sm text-gray-700 py-2">Cadastrar</a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</nav>
