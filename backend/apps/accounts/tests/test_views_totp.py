import pyotp
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class TOTPSetupTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )

    def test_setup_requires_auth(self):
        response = self.client.post("/api/accounts/2fa/setup/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_setup_returns_otpauth_uri(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/accounts/2fa/setup/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("otpauth_uri", response.data)
        self.assertTrue(response.data["otpauth_uri"].startswith("otpauth://totp/"))

    def test_setup_returns_secret(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/accounts/2fa/setup/")
        self.assertIn("secret", response.data)
        self.assertGreater(len(response.data["secret"]), 0)

    def test_setup_saves_secret_on_user(self):
        self.client.force_authenticate(user=self.user)
        self.client.post("/api/accounts/2fa/setup/")
        self.user.refresh_from_db()
        self.assertNotEqual(self.user.totp_secret, "")

    def test_setup_does_not_activate_2fa_yet(self):
        self.client.force_authenticate(user=self.user)
        self.client.post("/api/accounts/2fa/setup/")
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)


class TOTPConfirmTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.secret = pyotp.random_base32()
        self.user.totp_secret = self.secret
        self.user.save()

    def test_confirm_requires_auth(self):
        response = self.client.post("/api/accounts/2fa/confirm/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_confirm_with_valid_code_enables_2fa(self):
        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(self.secret).now()
        response = self.client.post("/api/accounts/2fa/confirm/", {"code": valid_code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.totp_enabled)

    def test_confirm_with_invalid_code_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/accounts/2fa/confirm/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)

    def test_confirm_without_secret_returns_400(self):
        self.client.force_authenticate(user=self.user)
        self.user.totp_secret = ""
        self.user.save()
        response = self.client.post("/api/accounts/2fa/confirm/", {"code": "123456"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TOTPDisableTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.secret = pyotp.random_base32()
        self.user.totp_secret = self.secret
        self.user.totp_enabled = True
        self.user.save()

    def test_disable_requires_auth(self):
        response = self.client.post("/api/accounts/2fa/disable/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_disable_with_valid_code_disables_2fa(self):
        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(self.secret).now()
        response = self.client.post("/api/accounts/2fa/disable/", {"code": valid_code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)
        self.assertEqual(self.user.totp_secret, "")

    def test_disable_with_invalid_code_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/accounts/2fa/disable/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.totp_enabled)

    def test_disable_when_not_enabled_returns_400(self):
        self.user.totp_enabled = False
        self.user.save()
        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(self.secret).now()
        response = self.client.post("/api/accounts/2fa/disable/", {"code": valid_code})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TOTPVerifyTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.secret = pyotp.random_base32()
        self.user.totp_secret = self.secret
        self.user.totp_enabled = True
        self.user.save()

    def test_verify_requires_auth(self):
        response = self.client.post("/api/accounts/2fa/verify/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_with_valid_code_returns_200(self):
        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(self.secret).now()
        response = self.client.post("/api/accounts/2fa/verify/", {"code": valid_code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["verified"])

    def test_verify_with_invalid_code_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/accounts/2fa/verify/", {"code": "000000"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_when_2fa_not_enabled_returns_400(self):
        self.user.totp_enabled = False
        self.user.save()
        self.client.force_authenticate(user=self.user)
        valid_code = pyotp.TOTP(self.secret).now()
        response = self.client.post("/api/accounts/2fa/verify/", {"code": valid_code})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
