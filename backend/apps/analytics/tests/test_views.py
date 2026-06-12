from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from apps.analytics.models import PageView
from apps.events.models import Event, EventRegistration
from apps.projects.models import Project
from apps.announcements.models import Announcement
from apps.comments.models import Comment

User = get_user_model()


class AnalyticsSummaryTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )

    def test_summary_requires_admin(self):
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_summary_requires_admin_not_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_summary_accessible_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_summary_contains_expected_fields(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/summary/")
        for field in ["total_members", "total_events", "total_projects",
                      "total_announcements", "total_comments",
                      "total_registrations", "total_pageviews",
                      "pageviews_last_7_days", "pageviews_last_30_days"]:
            self.assertIn(field, response.data, f"Campo ausente: {field}")

    def test_summary_counts_correctly(self):
        Project.objects.create(
            title="Projeto",
            description="desc",
            start_date="2026-01-01",
            created_by=self.admin,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.data["total_members"], 2)
        self.assertEqual(response.data["total_events"], 1)
        self.assertEqual(response.data["total_projects"], 1)

    def test_summary_counts_pageviews(self):
        ct = ContentType.objects.get_for_model(Event)
        PageView.objects.create(content_type=ct, object_id=self.event.pk, ip_address="1.1.1.1")
        PageView.objects.create(content_type=ct, object_id=self.event.pk, ip_address="2.2.2.2")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/summary/")
        self.assertEqual(response.data["pageviews_last_7_days"], 2)
        self.assertEqual(response.data["total_pageviews"], 2)


class PageViewHistoryTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )
        self.ct = ContentType.objects.get_for_model(Event)

    def test_history_requires_admin(self):
        response = self.client.get("/api/analytics/pageviews/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_history_requires_admin_not_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/analytics/pageviews/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_history_accessible_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/pageviews/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_history_returns_list(self):
        PageView.objects.create(content_type=self.ct, object_id=self.event.pk, ip_address="1.1.1.1")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/pageviews/")
        self.assertIsInstance(response.data, list)

    def test_history_each_entry_has_day_and_count(self):
        PageView.objects.create(content_type=self.ct, object_id=self.event.pk, ip_address="1.1.1.1")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/pageviews/")
        if response.data:
            entry = response.data[0]
            self.assertIn("day", entry)
            self.assertIn("count", entry)

    def test_history_days_param_30(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/analytics/pageviews/?days=30")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RecordPageViewTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento Pageview",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )

    def test_event_detail_records_pageview(self):
        initial_count = PageView.objects.count()
        self.client.get(f"/api/events/{self.event.pk}/")
        self.assertEqual(PageView.objects.count(), initial_count + 1)

    def test_event_list_does_not_record_pageview(self):
        initial_count = PageView.objects.count()
        self.client.get("/api/events/")
        self.assertEqual(PageView.objects.count(), initial_count)

    def test_pageview_stores_user_when_authenticated(self):
        self.client.force_authenticate(user=self.member)
        self.client.get(f"/api/events/{self.event.pk}/")
        pv = PageView.objects.last()
        self.assertEqual(pv.user, self.member)

    def test_pageview_stores_null_user_when_anonymous(self):
        self.client.get(f"/api/events/{self.event.pk}/")
        pv = PageView.objects.last()
        self.assertIsNone(pv.user)
