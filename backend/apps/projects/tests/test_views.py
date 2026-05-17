from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.projects.models import Project

User = get_user_model()


class ProjectViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.project = Project.objects.create(
            title="Reforma da Praça",
            description="Reforma completa da praça",
            start_date=timezone.now().date(),
            created_by=self.admin,
        )

    # --- Leitura pública ---
    def test_list_projects_is_public(self):
        response = self.client.get("/api/projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_detail_is_public(self):
        response = self.client.get(f"/api/projects/{self.project.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Reforma da Praça")

    # --- Criação: apenas admin ---
    def test_create_project_unauthenticated_returns_401(self):
        data = {
            "title": "Novo Projeto",
            "description": "desc",
            "start_date": timezone.now().date().isoformat(),
        }
        response = self.client.post("/api/projects/", data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_as_member_returns_403(self):
        self.client.force_authenticate(user=self.member)
        data = {
            "title": "Tentativa",
            "description": "desc",
            "start_date": timezone.now().date().isoformat(),
        }
        response = self.client.post("/api/projects/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_as_admin_returns_201(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "title": "Horta Comunitária",
            "description": "Horta para o bairro",
            "start_date": timezone.now().date().isoformat(),
        }
        response = self.client.post("/api/projects/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Horta Comunitária")

    # --- Edição: apenas admin ---
    def test_update_project_as_member_returns_403(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/projects/{self.project.pk}/", {"title": "Novo título"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_project_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/projects/{self.project.pk}/", {"status": "completed"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
