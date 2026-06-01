from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.analytics.mixins import RecordPageViewMixin
from .models import Event, EventRegistration
from .serializers import EventSerializer, EventRegistrationSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class EventViewSet(RecordPageViewMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["status"]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["date", "created_at", "title"]

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

        confirmed_count = event.registrations.filter(status="confirmed").count()
        if event.capacity is None or confirmed_count < event.capacity:
            reg_status = "confirmed"
        else:
            reg_status = "waitlisted"

        registration = EventRegistration.objects.create(
            user=request.user, event=event, status=reg_status
        )
        return Response(
            EventRegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        event = self.get_object()
        registration = get_object_or_404(EventRegistration, user=request.user, event=event)
        was_confirmed = registration.status == "confirmed"
        registration.delete()

        if was_confirmed and event.capacity is not None:
            next_waiting = (
                EventRegistration.objects.filter(event=event, status="waitlisted")
                .order_by("registered_at")
                .first()
            )
            if next_waiting:
                next_waiting.status = "confirmed"
                next_waiting.save(update_fields=["status"])

        return Response(status=status.HTTP_204_NO_CONTENT)
