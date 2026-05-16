from django.test import TestCase
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from apps.accounts.admin import UserAdmin

User = get_user_model()


class UserAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = UserAdmin(User, self.site)

    def test_list_display_contains_is_member(self):
        self.assertIn("is_member", self.admin.list_display)

    def test_list_filter_contains_is_member(self):
        self.assertIn("is_member", self.admin.list_filter)

    def test_search_fields_contains_username_and_email(self):
        self.assertIn("username", self.admin.search_fields)
        self.assertIn("email", self.admin.search_fields)
