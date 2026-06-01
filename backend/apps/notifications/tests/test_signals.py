from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.notifications.models import Notification
from apps.comments.models import Comment, CommentReaction
from apps.events.models import Event, EventRegistration

User = get_user_model()


class CommentSignalTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="dono", email="dono@test.com", password="senha123"
        )
        self.commenter = User.objects.create_user(
            username="comentador", email="coment@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento do Dono",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.owner,
        )
        self.content_type = ContentType.objects.get_for_model(Event)

    def test_comment_creates_notification_for_content_owner(self):
        Comment.objects.create(
            author=self.commenter,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Ótimo evento!",
        )
        self.assertTrue(
            Notification.objects.filter(user=self.owner).exists()
        )

    def test_comment_by_owner_does_not_notify_self(self):
        Comment.objects.create(
            author=self.owner,
            content_type=self.content_type,
            object_id=self.event.pk,
            text="Meu próprio comentário",
        )
        self.assertFalse(
            Notification.objects.filter(user=self.owner).exists()
        )


class CommentReactionSignalTest(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username="autor", email="autor@test.com", password="senha123"
        )
        self.reactor = User.objects.create_user(
            username="reator", email="reator@test.com", password="senha123"
        )
        admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=admin,
        )
        self.content_type = ContentType.objects.get_for_model(Event)
        self.comment = Comment.objects.create(
            author=self.author,
            content_type=self.content_type,
            object_id=event.pk,
            text="Comentário",
        )

    def test_reaction_creates_notification_for_comment_author(self):
        CommentReaction.objects.create(
            author=self.reactor,
            comment=self.comment,
            reaction_type="like",
        )
        self.assertTrue(
            Notification.objects.filter(user=self.author).exists()
        )

    def test_reaction_by_author_does_not_notify_self(self):
        CommentReaction.objects.create(
            author=self.author,
            comment=self.comment,
            reaction_type="like",
        )
        self.assertFalse(
            Notification.objects.filter(user=self.author).exists()
        )


class EventRegistrationSignalTest(TestCase):
    def setUp(self):
        self.event_creator = User.objects.create_user(
            username="criador", email="criador@test.com", password="senha123"
        )
        self.registrant = User.objects.create_user(
            username="inscrito", email="inscrito@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento com Inscrição",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.event_creator,
        )

    def test_registration_creates_notification_for_event_creator(self):
        EventRegistration.objects.create(
            user=self.registrant,
            event=self.event,
        )
        self.assertTrue(
            Notification.objects.filter(user=self.event_creator).exists()
        )

    def test_creator_registering_own_event_does_not_notify_self(self):
        EventRegistration.objects.create(
            user=self.event_creator,
            event=self.event,
        )
        self.assertFalse(
            Notification.objects.filter(user=self.event_creator).exists()
        )
