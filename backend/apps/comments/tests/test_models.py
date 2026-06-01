from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError
from django.utils import timezone
from apps.comments.models import Comment, CommentReaction
from apps.events.models import Event

User = get_user_model()


class CommentModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Festival",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.content_type = ContentType.objects.get_for_model(Event)

    def test_comment_str(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Ótimo evento!",
        )
        self.assertIn("membro", str(comment))

    def test_comment_has_created_at(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Vou participar!",
        )
        self.assertIsNotNone(comment.created_at)

    def test_comment_links_to_event_via_generic_fk(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Pergunta sobre o evento",
        )
        self.assertEqual(comment.content_object, self.event)

    def test_comment_not_reported_by_default(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Texto qualquer",
        )
        self.assertFalse(comment.is_reported)

    def test_comment_can_be_reported(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Texto ofensivo",
        )
        comment.is_reported = True
        comment.save()
        comment.refresh_from_db()
        self.assertTrue(comment.is_reported)

    def test_comment_parent_none_by_default(self):
        comment = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Comentário raiz",
        )
        self.assertIsNone(comment.parent)

    def test_comment_reply_links_to_parent(self):
        parent = Comment.objects.create(
            author=self.user,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Comentário raiz",
        )
        reply = Comment.objects.create(
            author=self.admin,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Resposta ao comentário",
            parent=parent,
        )
        self.assertEqual(reply.parent, parent)
        self.assertIn(reply, parent.replies.all())


class CommentReactionModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin2", email="admin2@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro2", email="membro2@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento Reação",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )
        self.content_type = ContentType.objects.get_for_model(Event)
        self.comment = Comment.objects.create(
            author=self.admin,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Comentário para reagir",
        )

    def test_reaction_like(self):
        reaction = CommentReaction.objects.create(
            author=self.user, comment=self.comment, reaction_type="like"
        )
        self.assertEqual(reaction.reaction_type, "like")

    def test_reaction_dislike(self):
        reaction = CommentReaction.objects.create(
            author=self.user, comment=self.comment, reaction_type="dislike"
        )
        self.assertEqual(reaction.reaction_type, "dislike")

    def test_reaction_unique_per_user_comment(self):
        CommentReaction.objects.create(
            author=self.user, comment=self.comment, reaction_type="like"
        )
        with self.assertRaises(IntegrityError):
            CommentReaction.objects.create(
                author=self.user, comment=self.comment, reaction_type="dislike"
            )

    def test_reaction_str(self):
        reaction = CommentReaction.objects.create(
            author=self.user, comment=self.comment, reaction_type="like"
        )
        self.assertIn("membro2", str(reaction))
        self.assertIn("like", str(reaction))
