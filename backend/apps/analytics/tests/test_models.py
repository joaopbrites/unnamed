from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.analytics.models import PageView
from apps.events.models import Event

User = get_user_model()


class PageViewModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento Analytics",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )
        self.content_type = ContentType.objects.get_for_model(Event)

    def test_pageview_with_user(self):
        pv = PageView.objects.create(
            content_type=self.content_type,
            object_id=self.event.pk,
            user=self.user,
            ip_address="127.0.0.1",
        )
        self.assertEqual(pv.user, self.user)
        self.assertEqual(pv.object_id, self.event.pk)

    def test_pageview_anonymous(self):
        pv = PageView.objects.create(
            content_type=self.content_type,
            object_id=self.event.pk,
            user=None,
            ip_address="192.168.1.1",
        )
        self.assertIsNone(pv.user)

    def test_pageview_has_created_at(self):
        pv = PageView.objects.create(
            content_type=self.content_type,
            object_id=self.event.pk,
            ip_address="10.0.0.1",
        )
        self.assertIsNotNone(pv.created_at)

    def test_pageview_str(self):
        pv = PageView.objects.create(
            content_type=self.content_type,
            object_id=self.event.pk,
            ip_address="10.0.0.1",
        )
        self.assertIn(str(self.event.pk), str(pv))
