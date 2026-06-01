from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_regular_user(self):
        user = User.objects.create_user(
            username="joao",
            email="joao@example.com",
            password="senha123",
        )
        self.assertEqual(user.username, "joao")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_member)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_str(self):
        user = User.objects.create_user(username="maria", password="senha123")
        self.assertEqual(str(user), "maria")

    def test_is_member_defaults_true(self):
        user = User.objects.create_user(username="teste", password="senha123")
        self.assertTrue(user.is_member)

    def test_bio_optional(self):
        user = User.objects.create_user(username="sem_bio", password="senha123")
        self.assertEqual(user.bio, "")

    def test_phone_optional(self):
        user = User.objects.create_user(username="sem_fone", password="senha123")
        self.assertEqual(user.phone, "")

    def test_totp_disabled_by_default(self):
        user = User.objects.create_user(username="totp_user", password="senha123")
        self.assertFalse(user.totp_enabled)

    def test_totp_secret_blank_by_default(self):
        user = User.objects.create_user(username="totp_user2", password="senha123")
        self.assertEqual(user.totp_secret, "")

    def test_totp_can_be_enabled(self):
        user = User.objects.create_user(username="totp_user3", password="senha123")
        user.totp_secret = "BASE32SECRET"
        user.totp_enabled = True
        user.save()
        user.refresh_from_db()
        self.assertTrue(user.totp_enabled)
        self.assertEqual(user.totp_secret, "BASE32SECRET")
