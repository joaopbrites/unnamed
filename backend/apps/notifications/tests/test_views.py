from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from apps.notifications.models import Notification
from apps.events.models import Event

User = get_user_model()


def make_notification(user, verb="teste"):
    admin = User.objects.filter(is_superuser=True).first()
    event = Event.objects.filter(created_by=admin).first()
    ct = ContentType.objects.get_for_model(Event)
    return Notification.objects.create(
        user=user,
        verb=verb,
        target_content_type=ct,
        target_object_id=event.pk,
    )


class NotificationListTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.other = User.objects.create_user(
            username="outro", email="outro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.notif = make_notification(self.member, "alguém comentou")

    def test_list_requires_auth(self):
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_own_notifications_only(self):
        make_notification(self.other, "outra notif")
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["verb"], "alguém comentou")

    def test_list_includes_is_read_field(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/notifications/")
        result = response.data["results"][0]
        self.assertIn("is_read", result)
        self.assertFalse(result["is_read"])

    def test_list_unread_filter(self):
        read_notif = make_notification(self.member, "lida")
        read_notif.is_read = True
        read_notif.save()
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/notifications/?unread=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertTrue(all(not r["is_read"] for r in results))

    def test_unread_count_endpoint(self):
        make_notification(self.member, "segunda")
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/notifications/unread_count/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 2)


class NotificationMarkReadTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.other = User.objects.create_user(
            username="outro", email="outro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.notif = make_notification(self.member)

    def test_mark_read_sets_is_read(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/notifications/{self.notif.pk}/mark_read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.is_read)

    def test_mark_read_requires_auth(self):
        response = self.client.post(f"/api/notifications/{self.notif.pk}/mark_read/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_mark_other_users_notification(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(f"/api/notifications/{self.notif.pk}/mark_read/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        make_notification(self.member, "segunda")
        self.client.force_authenticate(user=self.member)
        response = self.client.post("/api/notifications/mark_all_read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread = Notification.objects.filter(user=self.member, is_read=False).count()
        self.assertEqual(unread, 0)

    def test_mark_all_read_requires_auth(self):
        response = self.client.post("/api/notifications/mark_all_read/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
