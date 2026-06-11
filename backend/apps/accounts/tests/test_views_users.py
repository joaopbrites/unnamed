from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class UserAdminListTest(APITestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="super", email="super@test.com", password="super123"
        )
        self.staff = User.objects.create_user(
            username="staff", email="staff@test.com", password="staff123",
            is_staff=True
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )

    def test_list_requires_authentication(self):
        res = self.client.get("/api/accounts/users/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_forbidden_for_staff_non_superuser(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.get("/api/accounts/users/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_forbidden_for_regular_member(self):
        self.client.force_authenticate(user=self.member)
        res = self.client.get("/api/accounts/users/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_accessible_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get("/api/accounts/users/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_returns_all_users(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get("/api/accounts/users/")
        usernames = [u["username"] for u in res.data]
        self.assertIn("super", usernames)
        self.assertIn("staff", usernames)
        self.assertIn("membro", usernames)

    def test_list_contains_expected_fields(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get("/api/accounts/users/")
        for field in ("id", "username", "email", "is_member", "is_staff", "is_superuser", "date_joined"):
            self.assertIn(field, res.data[0])

    def test_list_does_not_expose_password_or_totp(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get("/api/accounts/users/")
        for field in ("password", "totp_secret"):
            self.assertNotIn(field, res.data[0])


class UserRoleUpdateTest(APITestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="super", email="super@test.com", password="super123"
        )
        self.staff = User.objects.create_user(
            username="staff", email="staff@test.com", password="staff123",
            is_staff=True
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )

    def test_promote_to_staff(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_staff": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member.refresh_from_db()
        self.assertTrue(self.member.is_staff)

    def test_promote_to_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_superuser": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member.refresh_from_db()
        self.assertTrue(self.member.is_superuser)

    def test_demote_staff(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.staff.pk}/",
            {"is_staff": False},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.staff.refresh_from_db()
        self.assertFalse(self.staff.is_staff)

    def test_toggle_is_member(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_member": False},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member.refresh_from_db()
        self.assertFalse(self.member.is_member)

    def test_cannot_edit_own_permissions(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.superuser.pk}/",
            {"is_superuser": False},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_not_allowed(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.put(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_staff": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_update_forbidden_for_staff_non_superuser(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.patch(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_staff": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_forbidden_for_regular_member(self):
        self.client.force_authenticate(user=self.member)
        res = self.client.patch(
            f"/api/accounts/users/{self.superuser.pk}/",
            {"is_superuser": False},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_nonexistent_user_returns_404(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            "/api/accounts/users/99999/",
            {"is_staff": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_response_contains_updated_fields(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.patch(
            f"/api/accounts/users/{self.member.pk}/",
            {"is_staff": True},
            format="json",
        )
        self.assertEqual(res.data["is_staff"], True)
        self.assertEqual(res.data["username"], "membro")
