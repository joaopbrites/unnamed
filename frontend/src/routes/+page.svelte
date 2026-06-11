<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { api } from '$lib/api';

  import heroImg from '$lib/assets/Gemini_Generated_Image_j9cr8aj9cr8aj9cr.png';
  import eventsImg from '$lib/assets/Gemini_Generated_Image_tb5yvptb5yvptb5y.png';
  import projectsImg from '$lib/assets/Gemini_Generated_Image_wtvhw5wtvhw5wtvh.png';
  import announcementsImg from '$lib/assets/Gemini_Generated_Image_vkkjn6vkkjn6vkkj.png';

  let events = [];
  let announcements = [];
  let projects = [];

  onMount(async () => {
    const [evRes, anRes, prRes] = await Promise.all([
      api.getEvents({ status: 'upcoming', ordering: 'date' }),
      api.getAnnouncements(),
      api.getProjects({ ordering: '-created_at' }),
    ]);
    if (evRes.ok) {
      const d = evRes.data;
      events = (Array.isArray(d) ? d : (d.results ?? [])).slice(0, 3);
    }
    if (anRes.ok) {
      const d = anRes.data;
      const all = Array.isArray(d) ? d : (d.results ?? []);
      announcements = all.sort((a, b) => b.is_pinned - a.is_pinned).slice(0, 3);
    }
    if (prRes.ok) {
      const d = prRes.data;
      projects = (Array.isArray(d) ? d : (d.results ?? [])).slice(0, 3);
    }
  });

  function fmtDate(s) {
    return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const EV_STATUS = { upcoming: 'Próximo', ongoing: 'Em andamento', past: 'Encerrado' };
  const EV_BADGE  = { upcoming: 'badge-blue', ongoing: 'badge-green', past: 'badge-gray' };
  const PR_STATUS = { planning: 'Planejamento', active: 'Ativo', completed: 'Concluído', cancelled: 'Cancelado' };
  const PR_BADGE  = { planning: 'badge-yellow', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
</script>

<svelte:head><title>Início — SDSC</title></svelte:head>

<!-- Hero -->
<section
  class="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 flex items-center justify-center"
  style="height:520px; background-image:url('{heroImg}'); background-size:cover; background-position:center;"
>
  <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/65"></div>
  <div class="relative z-10 text-center px-4 max-w-3xl">
    <h1 class="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4 leading-tight">
      Sociedade Desportiva<br>São Caetano
    </h1>
    <p class="text-xl text-white/90 mb-8 drop-shadow">
      Associação de bairro dedicada ao esporte, cultura e comunidade.
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="{base}/events" class="btn-primary px-8 py-3 text-base">Ver Eventos</a>
      <a href="{base}/projects" class="btn px-8 py-3 text-base bg-white/20 text-white border border-white/50 hover:bg-white/30 focus:ring-white">
        Nossos Projetos
      </a>
    </div>
  </div>
</section>

<!-- Cards de seção com imagem -->
<div class="mt-10 grid md:grid-cols-3 gap-5">
  <a
    href="{base}/events"
    class="group relative rounded-xl overflow-hidden block"
    style="height:200px; background-image:url('{eventsImg}'); background-size:cover; background-position:center top;"
  >
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 group-hover:from-black/85 transition-colors"></div>
    <div class="absolute bottom-0 left-0 right-0 p-5">
      <h2 class="text-xl font-bold text-white">Eventos</h2>
      <p class="text-sm text-white/80 mt-0.5">Participe das atividades do clube</p>
    </div>
  </a>

  <a
    href="{base}/projects"
    class="group relative rounded-xl overflow-hidden block"
    style="height:200px; background-image:url('{projectsImg}'); background-size:cover; background-position:center;"
  >
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 group-hover:from-black/85 transition-colors"></div>
    <div class="absolute bottom-0 left-0 right-0 p-5">
      <h2 class="text-xl font-bold text-white">Projetos</h2>
      <p class="text-sm text-white/80 mt-0.5">Iniciativas da nossa comunidade</p>
    </div>
  </a>

  <a
    href="{base}/announcements"
    class="group relative rounded-xl overflow-hidden block"
    style="height:200px; background-image:url('{announcementsImg}'); background-size:cover; background-position:center;"
  >
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 group-hover:from-black/85 transition-colors"></div>
    <div class="absolute bottom-0 left-0 right-0 p-5">
      <h2 class="text-xl font-bold text-white">Anúncios</h2>
      <p class="text-sm text-white/80 mt-0.5">Novidades e comunicados</p>
    </div>
  </a>
</div>

<!-- Sobre a associação -->
<section class="mt-14">
  <div class="text-center mb-10">
    <h2 class="text-3xl font-bold text-gray-900 mb-3">Sobre a SDSC</h2>
    <p class="text-gray-600 max-w-2xl mx-auto leading-relaxed">
      Fundada em 1987, a Sociedade Desportiva São Caetano nasceu da vontade dos moradores de criar um espaço de convivência,
      esporte e desenvolvimento humano no coração do bairro. Ao longo de quase quatro décadas, tornamo-nos referência em
      atividades esportivas, projetos sociais e integração comunitária para todas as idades.
    </p>
  </div>

  <div class="grid md:grid-cols-3 gap-6">
    <!-- Missão -->
    <div class="card text-center">
      <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Nossa Missão</h3>
      <p class="text-sm text-gray-600 leading-relaxed">
        Promover o esporte, a cultura e o bem-estar da comunidade, oferecendo estrutura, programas e oportunidades
        acessíveis a todos os moradores do bairro São Caetano e região.
      </p>
    </div>

    <!-- Visão -->
    <div class="card text-center">
      <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Nossa Visão</h3>
      <p class="text-sm text-gray-600 leading-relaxed">
        Ser reconhecida como a principal associação desportiva e cultural da região, referência em inclusão social,
        formação de atletas e fortalecimento do espírito comunitário.
      </p>
    </div>

    <!-- Valores -->
    <div class="card text-center">
      <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Nossos Valores</h3>
      <ul class="text-sm text-gray-600 space-y-1">
        <li>Inclusão e diversidade</li>
        <li>Respeito e fair play</li>
        <li>Solidariedade comunitária</li>
        <li>Saúde e qualidade de vida</li>
        <li>Transparência na gestão</li>
      </ul>
    </div>
  </div>
</section>

<!-- Conteúdo recente (aparece quando a API responde) -->
{#if events.length > 0 || projects.length > 0 || announcements.length > 0}
  <div class="mt-14 grid md:grid-cols-3 gap-8">

    <!-- Próximos Eventos -->
    {#if events.length > 0}
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Próximos Eventos</h2>
          <a href="{base}/events" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
        </div>
        <div class="space-y-3">
          {#each events as ev (ev.id)}
            <a href="{base}/events/{ev.id}" class="card block hover:shadow-md transition-shadow group">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ev.title}</h3>
                <span class="{EV_BADGE[ev.status] ?? 'badge-gray'} shrink-0">{EV_STATUS[ev.status] ?? ev.status}</span>
              </div>
              <p class="text-xs text-gray-500">{fmtDate(ev.date)}</p>
              <p class="text-xs text-gray-400 truncate">{ev.location}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Projetos Recentes -->
    {#if projects.length > 0}
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Projetos Recentes</h2>
          <a href="{base}/projects" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
        </div>
        <div class="space-y-3">
          {#each projects as pr (pr.id)}
            <a href="{base}/projects/{pr.id}" class="card block hover:shadow-md transition-shadow group">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{pr.title}</h3>
                <span class="{PR_BADGE[pr.status] ?? 'badge-gray'} shrink-0">{PR_STATUS[pr.status] ?? pr.status}</span>
              </div>
              {#if pr.start_date}
                <p class="text-xs text-gray-500">Início: {fmtDate(pr.start_date)}</p>
              {/if}
              <p class="text-xs text-gray-400 line-clamp-2">{pr.description}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Anúncios -->
    {#if announcements.length > 0}
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Anúncios</h2>
          <a href="{base}/announcements" class="text-sm text-blue-600 hover:underline">Ver todos →</a>
        </div>
        <div class="space-y-3">
          {#each announcements as ann (ann.id)}
            <a href="{base}/announcements/{ann.id}" class="card block hover:shadow-md transition-shadow group">
              {#if ann.is_pinned}
                <span class="badge-blue mb-1 inline-block">📌 Fixado</span>
              {/if}
              <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ann.title}</h3>
              <p class="text-xs text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
            </a>
          {/each}
        </div>
      </section>
    {/if}

  </div>
{/if}
