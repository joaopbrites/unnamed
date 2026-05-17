from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Event, EventRegistration
from .serializers import EventSerializer, EventRegistrationSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()
        if EventRegistration.objects.filter(user=request.user, event=event).exists():
            return Response(
                {"detail": "Você já está inscrito neste evento."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        registration = EventRegistration.objects.create(user=request.user, event=event)
        return Response(
            EventRegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        event = self.get_object()
        registration = get_object_or_404(EventRegistration, user=request.user, event=event)
        registration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
