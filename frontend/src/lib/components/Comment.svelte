<script>
  import { authStore } from '$lib/stores/auth';
  import { api } from '$lib/api';

  export let comment;
  export let onReply = null;

  let user = null;
  authStore.subscribe((u) => (user = u));

  let showReplies = false;
  let replies = [];
  let loadingReplies = false;
  let replyText = '';
  let showReplyForm = false;
  let reported = comment.is_reported;

  $: likesCount = comment.likes_count ?? 0;
  $: dislikesCount = comment.dislikes_count ?? 0;
  $: userReaction = comment.user_reaction;

  async function react(type) {
    if (!user) return;
    const { ok, data } = await api.reactComment(comment.id, type);
    if (ok) {
      comment = { ...comment, ...data };
    }
  }

  async function toggleReplies() {
    showReplies = !showReplies;
    if (showReplies && replies.length === 0) {
      loadingReplies = true;
      const { ok, data } = await api.getReplies(comment.id);
      if (ok) replies = Array.isArray(data) ? data : (data.results ?? []);
      loadingReplies = false;
    }
  }

  async function submitReply() {
    if (!replyText.trim()) return;
    const { ok, data } = await api.createComment({
      content_type: comment.content_type,
      object_id: comment.object_id,
      text: replyText.trim(),
      parent: comment.id,
    });
    if (ok) {
      replies = [...replies, data];
      replyText = '';
      showReplyForm = false;
      showReplies = true;
      comment = { ...comment, replies_count: (comment.replies_count ?? 0) + 1 };
      if (onReply) onReply();
    }
  }

  async function report() {
    if (!user || reported) return;
    const { ok } = await api.reportComment(comment.id);
    if (ok) reported = true;
  }
</script>

<div class="flex gap-3">
  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
    {(comment.author_username ?? '?')[0].toUpperCase()}
  </div>

  <div class="flex-1 min-w-0">
    <div class="bg-gray-50 rounded-lg px-4 py-3">
      <p class="text-sm font-semibold text-gray-900">{comment.author_username ?? 'Usuário'}</p>
      <p class="text-sm text-gray-700 mt-1">{comment.text}</p>
    </div>

    <div class="flex items-center gap-4 mt-1.5 px-1">
      <p class="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</p>

      {#if user}
        <button
          on:click={() => react('like')}
          class="flex items-center gap-1 text-xs {userReaction === 'like' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'}"
          aria-label="Curtir comentário"
        >
          👍 {likesCount}
        </button>
        <button
          on:click={() => react('dislike')}
          class="flex items-center gap-1 text-xs {userReaction === 'dislike' ? 'text-red-500 font-semibold' : 'text-gray-500 hover:text-red-500'}"
          aria-label="Não curtir comentário"
        >
          👎 {dislikesCount}
        </button>
        <button
          on:click={() => (showReplyForm = !showReplyForm)}
          class="text-xs text-gray-500 hover:text-blue-600"
        >
          Responder
        </button>
        <button
          on:click={report}
          disabled={reported}
          class="text-xs {reported ? 'text-orange-400 cursor-default' : 'text-gray-400 hover:text-orange-500'}"
          aria-label="Denunciar comentário"
        >
          {reported ? 'Denunciado' : 'Denunciar'}
        </button>
      {/if}

      {#if comment.replies_count > 0}
        <button on:click={toggleReplies} class="text-xs text-blue-600 hover:underline">
          {showReplies ? 'Ocultar' : `Ver ${comment.replies_count} respostas`}
        </button>
      {/if}
    </div>

    {#if showReplyForm && user}
      <div class="mt-2 flex gap-2">
        <input
          type="text"
          bind:value={replyText}
          placeholder="Escreva uma resposta..."
          class="input text-sm flex-1"
          on:keydown={(e) => e.key === 'Enter' && submitReply()}
        />
        <button on:click={submitReply} class="btn-primary text-sm px-3 py-1">Enviar</button>
      </div>
    {/if}

    {#if showReplies}
      <div class="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
        {#if loadingReplies}
          <p class="text-sm text-gray-400">Carregando respostas...</p>
        {:else}
          {#each replies as reply (reply.id)}
            <svelte:self comment={reply} />
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>
