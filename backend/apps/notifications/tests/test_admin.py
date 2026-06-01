from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.notifications.models import Notification
from apps.events.models import Event

User = get_user_model()


class NotificationAdminTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.client.force_login(self.admin_user)

    def test_notification_registered_in_admin(self):
        from django.contrib import admin
        self.assertIn(Notification, admin.site._registry)

    def test_admin_list_accessible(self):
        response = self.client.get("/admin/notifications/notification/")
        self.assertEqual(response.status_code, 200)
