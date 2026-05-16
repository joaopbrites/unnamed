from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.comments.models import Comment
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
