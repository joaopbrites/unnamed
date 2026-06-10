<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { api } from '$lib/api';
  import Comment from './Comment.svelte';

  export let contentType;
  export let objectId;

  let user = null;
  authStore.subscribe((u) => (user = u));

  let comments = [];
  let loading = true;
  let newText = '';
  let submitting = false;
  let error = '';

  onMount(loadComments);

  async function loadComments() {
    loading = true;
    const { ok, data } = await api.getComments(contentType, objectId);
    if (ok) {
      const list = Array.isArray(data) ? data : (data.results ?? []);
      comments = list.filter((c) => !c.parent);
    }
    loading = false;
  }

  async function submitComment() {
    if (!newText.trim()) return;
    submitting = true;
    error = '';
    const { ok, data } = await api.createComment({
      content_type: contentType,
      object_id: objectId,
      text: newText.trim(),
    });
    submitting = false;
    if (ok) {
      comments = [...comments, data];
      newText = '';
    } else {
      error = data?.detail ?? data?.text?.[0] ?? 'Erro ao enviar comentário.';
    }
  }
</script>

<section aria-label="Comentários">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">
    Comentários ({comments.length})
  </h2>

  {#if loading}
    <p class="text-gray-400 text-sm">Carregando comentários...</p>
  {:else if comments.length === 0}
    <p class="text-gray-500 text-sm">Nenhum comentário ainda. Seja o primeiro!</p>
  {:else}
    <div class="space-y-4">
      {#each comments as comment (comment.id)}
        <Comment {comment} />
      {/each}
    </div>
  {/if}

  {#if user}
    <div class="mt-6">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Adicionar comentário</h3>
      {#if error}
        <p class="text-sm text-red-600 mb-2">{error}</p>
      {/if}
      <div class="flex gap-2">
        <textarea
          bind:value={newText}
          rows="2"
          placeholder="Escreva um comentário..."
          class="input resize-none flex-1 text-sm"
          aria-label="Novo comentário"
        ></textarea>
        <button
          on:click={submitComment}
          disabled={submitting || !newText.trim()}
          class="btn-primary self-end"
        >
          {submitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  {:else}
    <p class="mt-6 text-sm text-gray-500">
      <a href="/login" class="text-blue-600 hover:underline">Faça login</a> para comentar.
    </p>
  {/if}
</section>
