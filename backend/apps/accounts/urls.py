from django.urls import path
from .views import (
    RegisterView, MeView, UserProfileView,
    TOTPSetupView, TOTPConfirmView, TOTPDisableView, TOTPVerifyView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("<int:pk>/profile/", UserProfileView.as_view(), name="user-profile"),
    path("2fa/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("2fa/confirm/", TOTPConfirmView.as_view(), name="totp-confirm"),
    path("2fa/disable/", TOTPDisableView.as_view(), name="totp-disable"),
    path("2fa/verify/", TOTPVerifyView.as_view(), name="totp-verify"),
]
