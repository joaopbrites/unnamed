from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.events.models import Event, EventRegistration

User = get_user_model()


class EventViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Festival do Bairro",
            description="Festival anual do bairro",
            date=timezone.now() + timezone.timedelta(days=10),
            location="Praça Central",
            created_by=self.admin,
        )

    # --- Leitura pública ---
    def test_list_events_is_public(self):
        response = self.client.get("/api/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_detail_is_public(self):
        response = self.client.get(f"/api/events/{self.event.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Festival do Bairro")

    def test_response_contains_registration_count(self):
        response = self.client.get(f"/api/events/{self.event.pk}/")
        self.assertIn("registrations_count", response.data)

    # --- Criação: apenas admin ---
    def test_create_event_unauthenticated_returns_401(self):
        data = {
            "title": "Novo Evento",
            "description": "desc",
            "date": (timezone.now() + timezone.timedelta(days=5)).isoformat(),
            "location": "Local",
        }
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_event_as_member_returns_403(self):
        self.client.force_authenticate(user=self.member)
        data = {
            "title": "Tentativa",
            "description": "desc",
            "date": (timezone.now() + timezone.timedelta(days=5)).isoformat(),
            "location": "Local",
        }
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_event_as_admin_returns_201(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "title": "Novo Evento Admin",
            "description": "desc",
            "date": (timezone.now() + timezone.timedelta(days=5)).isoformat(),
            "location": "Local",
        }
        response = self.client.post("/api/events/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Novo Evento Admin")

    # --- Inscrição ---
    def test_register_unauthenticated_returns_401(self):
        response = self.client.post(f"/api/events/{self.event.pk}/register/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_authenticated_returns_201(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/events/{self.event.pk}/register/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            EventRegistration.objects.filter(user=self.member, event=self.event).exists()
        )

    def test_register_twice_returns_400(self):
        EventRegistration.objects.create(user=self.member, event=self.event)
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/events/{self.event.pk}/register/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unregister_authenticated_returns_204(self):
        EventRegistration.objects.create(user=self.member, event=self.event)
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f"/api/events/{self.event.pk}/unregister/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            EventRegistration.objects.filter(user=self.member, event=self.event).exists()
        )
