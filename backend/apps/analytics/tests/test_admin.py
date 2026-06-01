from django.test import TestCase
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.analytics.models import PageView
from apps.analytics.admin import PageViewAdmin
from apps.events.models import Event

User = get_user_model()


class PageViewAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.client.force_login(self.admin_user)
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=1),
            location="Local",
            created_by=self.admin_user,
        )

    def test_pageview_registered_in_admin(self):
        from django.contrib import admin
        self.assertIn(PageView, admin.site._registry)

    def test_admin_list_accessible(self):
        response = self.client.get("/admin/analytics/pageview/")
        self.assertEqual(response.status_code, 200)
