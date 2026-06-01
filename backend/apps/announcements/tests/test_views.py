from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.announcements.models import Announcement

User = get_user_model()


class AnnouncementViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.announcement = Announcement.objects.create(
            title="Aviso Importante",
            content="Haverá reunião no sábado às 10h.",
            created_by=self.admin,
        )

    # --- Leitura pública ---
    def test_list_announcements_is_public(self):
        response = self.client.get("/api/announcements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_announcement_detail_is_public(self):
        response = self.client.get(f"/api/announcements/{self.announcement.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Aviso Importante")

    # --- Criação: apenas admin ---
    def test_create_announcement_unauthenticated_returns_401(self):
        data = {"title": "Aviso", "content": "conteúdo"}
        response = self.client.post("/api/announcements/", data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_announcement_as_member_returns_403(self):
        self.client.force_authenticate(user=self.member)
        data = {"title": "Tentativa", "content": "conteúdo"}
        response = self.client.post("/api/announcements/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_announcement_as_admin_returns_201(self):
        self.client.force_authenticate(user=self.admin)
        data = {"title": "Novo Aviso", "content": "conteúdo do novo aviso"}
        response = self.client.post("/api/announcements/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Novo Aviso")

    # --- Ordenação: fixados primeiro ---
    def test_pinned_announcements_appear_first(self):
        Announcement.objects.create(
            title="Aviso Fixado",
            content="muito importante",
            is_pinned=True,
            created_by=self.admin,
        )
        response = self.client.get("/api/announcements/")
        results = response.data["results"]
        self.assertTrue(results[0]["is_pinned"])

    # --- Edição: apenas admin ---
    def test_update_announcement_as_member_returns_403(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/announcements/{self.announcement.pk}/", {"is_pinned": True}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_announcement_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/announcements/{self.announcement.pk}/", {"is_pinned": True}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_pinned"])
