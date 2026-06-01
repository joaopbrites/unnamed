from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.notifications.models import Notification
from apps.events.models import Event

User = get_user_model()


class NotificationModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento Notif",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )
        self.content_type = ContentType.objects.get_for_model(Event)

    def test_notification_created(self):
        notif = Notification.objects.create(
            user=self.user,
            verb="comentou no seu evento",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        self.assertEqual(notif.user, self.user)
        self.assertEqual(notif.verb, "comentou no seu evento")

    def test_notification_unread_by_default(self):
        notif = Notification.objects.create(
            user=self.user,
            verb="novo comentário",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        self.assertFalse(notif.is_read)

    def test_notification_can_be_marked_read(self):
        notif = Notification.objects.create(
            user=self.user,
            verb="novo comentário",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        notif.is_read = True
        notif.save()
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_notification_has_created_at(self):
        notif = Notification.objects.create(
            user=self.user,
            verb="teste",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        self.assertIsNotNone(notif.created_at)

    def test_notification_str(self):
        notif = Notification.objects.create(
            user=self.user,
            verb="curtiu seu comentário",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        self.assertIn("membro", str(notif))
        self.assertIn("curtiu seu comentário", str(notif))

    def test_notification_ordering_newest_first(self):
        n1 = Notification.objects.create(
            user=self.user,
            verb="primeiro",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        n2 = Notification.objects.create(
            user=self.user,
            verb="segundo",
            target_content_type=self.content_type,
            target_object_id=self.event.pk,
        )
        notifs = list(Notification.objects.filter(user=self.user))
        self.assertEqual(notifs[0], n2)
        self.assertEqual(notifs[1], n1)
