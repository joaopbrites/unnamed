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

<footer class="mt-16 border-t border-gray-200 bg-gray-900 text-gray-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid md:grid-cols-3 gap-10">

      <!-- Sobre -->
      <div>
        <h3 class="text-white font-semibold text-lg mb-3">SDSC</h3>
        <p class="text-sm leading-relaxed text-gray-400">
          Sociedade Desportiva São Caetano — promovendo esporte, cultura e
          comunidade desde 1987 no coração do bairro São Caetano.
        </p>
      </div>

      <!-- Links rápidos -->
      <div>
        <h3 class="text-white font-semibold text-lg mb-3">Acesso rápido</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/unnamed/events" class="hover:text-white transition-colors">Eventos</a></li>
          <li><a href="/unnamed/projects" class="hover:text-white transition-colors">Projetos</a></li>
          <li><a href="/unnamed/announcements" class="hover:text-white transition-colors">Anúncios</a></li>
          <li><a href="/unnamed/login" class="hover:text-white transition-colors">Entrar</a></li>
          <li><a href="/unnamed/register" class="hover:text-white transition-colors">Cadastrar-se</a></li>
        </ul>
      </div>

      <!-- Contato -->
      <div>
        <h3 class="text-white font-semibold text-lg mb-3">Contato</h3>
        <ul class="space-y-2 text-sm text-gray-400">
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Rua São Caetano, 150 — Bairro São Caetano<br>Belo Horizonte — MG, 30160-000
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            (31) 3333-4444
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            contato@sdsc.org.br
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Seg–Sex 8h–18h &nbsp;|&nbsp; Sáb 8h–12h
          </li>
        </ul>
      </div>

    </div>

    <div class="mt-10 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} Sociedade Desportiva São Caetano — GAC116 Programação Web
    </div>
  </div>
</footer>
