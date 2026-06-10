<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import { authStore } from '$lib/stores/auth';

  onMount(async () => {
    await authStore.init();
  });
</script>

<Navbar />

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <slot />
</main>

<footer class="mt-16 border-t border-gray-200 py-8 text-center text-sm text-gray-400">
  © {new Date().getFullYear()} Sociedade Desportiva São Caetano — GAC116 Programação Web
</footer>
