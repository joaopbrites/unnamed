from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.projects.models import Project

User = get_user_model()


class ProjectModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.project = Project.objects.create(
            title="Reforma da Quadra",
            description="Reforma completa da quadra poliesportiva",
            start_date=timezone.now().date(),
            created_by=self.admin,
        )

    def test_project_str(self):
        self.assertEqual(str(self.project), "Reforma da Quadra")

    def test_project_default_status_is_active(self):
        self.assertEqual(self.project.status, "active")

    def test_project_end_date_optional(self):
        self.assertIsNone(self.project.end_date)

    def test_project_has_created_at(self):
        self.assertIsNotNone(self.project.created_at)

    def test_project_ordering_by_created_at(self):
        Project.objects.create(
            title="Horta Comunitária",
            description="desc",
            start_date=timezone.now().date(),
            created_by=self.admin,
        )
        projects = list(Project.objects.all())
        self.assertEqual(projects[0].title, "Reforma da Quadra")
