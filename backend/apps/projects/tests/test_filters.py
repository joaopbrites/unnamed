from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from apps.projects.models import Project

User = get_user_model()


class ProjectFilterTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.active = Project.objects.create(
            title="Reforma da Quadra",
            description="Reforma do piso",
            start_date="2026-01-01",
            status="active",
            created_by=self.admin,
        )
        self.completed = Project.objects.create(
            title="Pintura da Sede",
            description="Pintura completa",
            start_date="2025-01-01",
            status="completed",
            created_by=self.admin,
        )

    def test_filter_by_status(self):
        response = self.client.get("/api/projects/?status=active")
        results = response.data["results"]
        self.assertTrue(all(p["status"] == "active" for p in results))

    def test_search_by_title(self):
        response = self.client.get("/api/projects/?search=Quadra")
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Reforma da Quadra")

    def test_ordering_by_created_at(self):
        response = self.client.get("/api/projects/?ordering=-created_at")
        self.assertEqual(response.status_code, 200)
