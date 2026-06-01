from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.events.models import Event

User = get_user_model()


class EventFilterTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.upcoming = Event.objects.create(
            title="Festa Junina",
            description="Festa do bairro",
            date=timezone.now() + timezone.timedelta(days=10),
            location="Quadra",
            status="upcoming",
            created_by=self.admin,
        )
        self.completed = Event.objects.create(
            title="Torneio Encerrado",
            description="Torneio de futebol",
            date=timezone.now() - timezone.timedelta(days=5),
            location="Campo",
            status="completed",
            created_by=self.admin,
        )

    def test_filter_by_status(self):
        response = self.client.get("/api/events/?status=upcoming")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertTrue(all(e["status"] == "upcoming" for e in results))

    def test_filter_completed_status(self):
        response = self.client.get("/api/events/?status=completed")
        results = response.data["results"]
        self.assertTrue(all(e["status"] == "completed" for e in results))

    def test_search_by_title(self):
        response = self.client.get("/api/events/?search=Junina")
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Festa Junina")

    def test_ordering_by_date_asc(self):
        response = self.client.get("/api/events/?ordering=date")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering_by_date_desc(self):
        response = self.client.get("/api/events/?ordering=-date")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
