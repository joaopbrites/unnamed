import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/api', () => ({
  api: {
    reactComment: vi.fn(),
    reportComment: vi.fn(),
    getReplies: vi.fn(),
    createComment: vi.fn(),
  },
}));
vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (fn) => {
      fn({ id: 1, username: 'joao', is_staff: false });
      return () => {};
    },
  },
}));

import Comment from './Comment.svelte';
import { api } from '$lib/api';

const fakeComment = {
  id: 10,
  author: 1,
  author_username: 'maria',
  content_type: 'events.event',
  object_id: 5,
  text: 'Ótimo evento!',
  is_reported: false,
  replies_count: 2,
  likes_count: 3,
  dislikes_count: 1,
  user_reaction: null,
  created_at: '2026-05-15T10:00:00Z',
  parent: null,
};

beforeEach(() => {
  api.reactComment.mockResolvedValue({ ok: true, data: { likes_count: 4, dislikes_count: 1, user_reaction: 'like' } });
  api.reportComment.mockResolvedValue({ ok: true, data: {} });
  api.getReplies.mockResolvedValue({ ok: true, data: [] });
  api.createComment.mockResolvedValue({ ok: true, data: { id: 20, text: 'Resposta', replies_count: 0, likes_count: 0, dislikes_count: 0 } });
});

describe('Comment', () => {
  it('exibe o nome do autor', () => {
    render(Comment, { props: { comment: fakeComment } });
    expect(screen.getByText('maria')).toBeInTheDocument();
  });

  it('exibe o texto do comentário', () => {
    render(Comment, { props: { comment: fakeComment } });
    expect(screen.getByText('Ótimo evento!')).toBeInTheDocument();
  });

  it('exibe contagem de likes e dislikes', () => {
    render(Comment, { props: { comment: fakeComment } });
    expect(screen.getByText(/👍.*3/)).toBeInTheDocument();
    expect(screen.getByText(/👎.*1/)).toBeInTheDocument();
  });

  it('exibe botão "Ver X respostas" quando replies_count > 0', () => {
    render(Comment, { props: { comment: fakeComment } });
    expect(screen.getByText('Ver 2 respostas')).toBeInTheDocument();
  });

  it('chama api.reactComment ao clicar em curtir', async () => {
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByLabelText('Curtir comentário'));
    expect(api.reactComment).toHaveBeenCalledWith(10, 'like');
  });

  it('chama api.reactComment ao clicar em não curtir', async () => {
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByLabelText('Não curtir comentário'));
    expect(api.reactComment).toHaveBeenCalledWith(10, 'dislike');
  });

  it('chama api.reportComment ao clicar em denunciar', async () => {
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByLabelText('Denunciar comentário'));
    await waitFor(() => {
      expect(api.reportComment).toHaveBeenCalledWith(10);
    });
  });

  it('exibe "Denunciado" após reportar', async () => {
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByLabelText('Denunciar comentário'));
    await waitFor(() => {
      expect(screen.getByText('Denunciado')).toBeInTheDocument();
    });
  });

  it('carrega respostas ao clicar em "Ver X respostas"', async () => {
    api.getReplies.mockResolvedValue({
      ok: true,
      data: [{ id: 11, author_username: 'pedro', text: 'Concordo!', likes_count: 0, dislikes_count: 0, replies_count: 0, user_reaction: null, created_at: '2026-05-16T00:00:00Z' }],
    });
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByText('Ver 2 respostas'));
    await waitFor(() => {
      expect(api.getReplies).toHaveBeenCalledWith(10);
      expect(screen.getByText('Concordo!')).toBeInTheDocument();
    });
  });

  it('exibe formulário de resposta ao clicar em Responder', async () => {
    const user = userEvent.setup();
    render(Comment, { props: { comment: fakeComment } });

    await user.click(screen.getByText('Responder'));
    expect(screen.getByPlaceholderText('Escreva uma resposta...')).toBeInTheDocument();
  });

  it('exibe a initial do autor no avatar', () => {
    render(Comment, { props: { comment: fakeComment } });
    // A inicial de 'maria' deve aparecer no avatar
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
