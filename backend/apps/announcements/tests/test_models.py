from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.announcements.models import Announcement

User = get_user_model()


class AnnouncementModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.announcement = Announcement.objects.create(
            title="Reunião de Assembleia",
            content="Haverá reunião no próximo sábado às 10h.",
            category="meeting",
            created_by=self.admin,
        )

    def test_announcement_str(self):
        self.assertEqual(str(self.announcement), "Reunião de Assembleia")

    def test_announcement_not_pinned_by_default(self):
        self.assertFalse(self.announcement.is_pinned)

    def test_announcement_has_created_at(self):
        self.assertIsNotNone(self.announcement.created_at)

    def test_announcement_default_category(self):
        ann = Announcement.objects.create(
            title="Aviso Geral",
            content="conteúdo",
            created_by=self.admin,
        )
        self.assertEqual(ann.category, "general")

    def test_pinned_announcement_ordering_first(self):
        pinned = Announcement.objects.create(
            title="Fixado",
            content="importante",
            is_pinned=True,
            created_by=self.admin,
        )
        announcements = list(Announcement.objects.all())
        self.assertEqual(announcements[0], pinned)
