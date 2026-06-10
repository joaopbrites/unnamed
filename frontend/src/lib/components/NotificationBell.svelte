<script>
  import { onMount } from 'svelte';
  import { notificationsStore } from '$lib/stores/notifications';

  let open = false;
  let { notifications, unreadCount } = { notifications: [], unreadCount: 0 };

  const unsub = notificationsStore.subscribe((s) => {
    notifications = s.notifications;
    unreadCount = s.unreadCount;
  });

  onMount(async () => {
    await notificationsStore.fetchUnreadCount();
    return unsub;
  });

  async function toggleOpen() {
    open = !open;
    if (open && notifications.length === 0) {
      await notificationsStore.fetchNotifications();
    }
  }

  async function markRead(id) {
    await notificationsStore.markRead(id);
  }

  async function markAll() {
    await notificationsStore.markAllRead();
  }
</script>

<div class="relative">
  <button
    on:click={toggleOpen}
    class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
    aria-label="Notificações"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {#if unreadCount > 0}
      <span
        class="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
        aria-label="{unreadCount} notificações não lidas"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    {/if}
  </button>

  {#if open}
    <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">Notificações</h3>
        {#if unreadCount > 0}
          <button on:click={markAll} class="text-sm text-blue-600 hover:underline">
            Marcar todas como lidas
          </button>
        {/if}
      </div>

      <ul class="max-h-72 overflow-y-auto divide-y divide-gray-100">
        {#if notifications.length === 0}
          <li class="px-4 py-6 text-center text-gray-500 text-sm">Nenhuma notificação</li>
        {:else}
          {#each notifications as n (n.id)}
            <li
              class="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer {n.is_read ? 'opacity-60' : ''}"
              on:click={() => markRead(n.id)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && markRead(n.id)}
            >
              {#if !n.is_read}
                <span class="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
              {:else}
                <span class="mt-1.5 w-2 h-2 flex-shrink-0"></span>
              {/if}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800">{n.verb}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </li>
          {/each}
        {/if}
      </ul>
    </div>

    <div class="fixed inset-0 z-40" on:click={() => (open = false)} role="presentation"></div>
  {/if}
</div>
