import pyotp
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import UserRegistrationSerializer, UserPublicSerializer, UserProfileSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPublicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserProfileSerializer(user, context={"request": request})
        return Response(serializer.data)


class TOTPSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        secret = pyotp.random_base32()
        request.user.totp_secret = secret
        request.user.save(update_fields=["totp_secret"])

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=request.user.email or request.user.username,
            issuer_name="SDSC",
        )
        return Response({"secret": secret, "otpauth_uri": uri})


class TOTPConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "")

        if not user.totp_secret:
            return Response(
                {"detail": "Execute o setup do 2FA primeiro."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(str(code)):
            return Response(
                {"detail": "Código inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.totp_enabled = True
        user.save(update_fields=["totp_enabled"])
        return Response({"detail": "2FA ativado com sucesso."})


class TOTPDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "")

        if not user.totp_enabled:
            return Response(
                {"detail": "O 2FA não está ativado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(str(code)):
            return Response(
                {"detail": "Código inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.totp_enabled = False
        user.totp_secret = ""
        user.save(update_fields=["totp_enabled", "totp_secret"])
        return Response({"detail": "2FA desativado."})


class TOTPVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "")

        if not user.totp_enabled:
            return Response(
                {"detail": "O 2FA não está ativado para este usuário."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(str(code)):
            return Response(
                {"detail": "Código inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"verified": True, "detail": "Código válido."})
