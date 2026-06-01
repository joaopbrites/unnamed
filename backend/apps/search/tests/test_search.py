from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.events.models import Event
from apps.projects.models import Project
from apps.announcements.models import Announcement

User = get_user_model()


class GlobalSearchTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.event = Event.objects.create(
            title="Festa Junina do Bairro",
            description="Festa tradicional",
            date=timezone.now() + timezone.timedelta(days=10),
            location="Quadra",
            created_by=self.admin,
        )
        self.project = Project.objects.create(
            title="Reforma da Quadra",
            description="Projeto de reforma",
            start_date="2026-01-01",
            created_by=self.admin,
        )
        self.announcement = Announcement.objects.create(
            title="Reunião de Moradores",
            content="Reunião na sede",
            created_by=self.admin,
        )

    def test_search_is_public(self):
        response = self.client.get("/api/search/?q=bairro")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_returns_categorized_results(self):
        response = self.client.get("/api/search/?q=bairro")
        self.assertIn("events", response.data)
        self.assertIn("projects", response.data)
        self.assertIn("announcements", response.data)

    def test_search_finds_event_by_title(self):
        response = self.client.get("/api/search/?q=Junina")
        self.assertEqual(len(response.data["events"]), 1)
        self.assertEqual(response.data["events"][0]["title"], "Festa Junina do Bairro")

    def test_search_finds_project_by_title(self):
        response = self.client.get("/api/search/?q=Reforma")
        self.assertEqual(len(response.data["projects"]), 1)

    def test_search_finds_announcement_by_title(self):
        response = self.client.get("/api/search/?q=Reunião")
        self.assertEqual(len(response.data["announcements"]), 1)

    def test_search_finds_by_description(self):
        response = self.client.get("/api/search/?q=tradicional")
        self.assertEqual(len(response.data["events"]), 1)

    def test_search_empty_query_returns_empty(self):
        response = self.client.get("/api/search/?q=")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["events"]), 0)
        self.assertEqual(len(response.data["projects"]), 0)
        self.assertEqual(len(response.data["announcements"]), 0)

    def test_search_no_results(self):
        response = self.client.get("/api/search/?q=xyzabc123")
        self.assertEqual(len(response.data["events"]), 0)
        self.assertEqual(len(response.data["projects"]), 0)
        self.assertEqual(len(response.data["announcements"]), 0)

    def test_search_missing_q_returns_empty(self):
        response = self.client.get("/api/search/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["events"]), 0)
