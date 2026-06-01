from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from apps.events.models import Event, EventRegistration
from apps.comments.models import Comment

User = get_user_model()


class UserProfileTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123",
            first_name="João", bio="Bio do membro",
        )
        self.other = User.objects.create_user(
            username="outro", email="outro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento Perfil",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Local",
            created_by=self.admin,
        )

    def test_profile_requires_auth(self):
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_accessible_by_authenticated(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_profile_contains_basic_fields(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        for field in ["id", "username", "bio", "recent_registrations", "recent_comments"]:
            self.assertIn(field, response.data, f"Campo ausente: {field}")

    def test_profile_does_not_expose_sensitive_fields(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        for field in ["password", "email", "totp_secret"]:
            self.assertNotIn(field, response.data, f"Campo sensível exposto: {field}")

    def test_profile_shows_recent_registrations(self):
        EventRegistration.objects.create(user=self.member, event=self.event)
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        self.assertEqual(len(response.data["recent_registrations"]), 1)

    def test_profile_shows_recent_comments(self):
        ct = ContentType.objects.get_for_model(Event)
        Comment.objects.create(
            author=self.member,
            content_type=ct,
            object_id=self.event.pk,
            text="Comentário no perfil",
        )
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/accounts/{self.member.pk}/profile/")
        self.assertEqual(len(response.data["recent_comments"]), 1)

    def test_profile_404_for_nonexistent_user(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get("/api/accounts/99999/profile/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
