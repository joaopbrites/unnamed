from rest_framework import viewsets, permissions
from apps.analytics.mixins import RecordPageViewMixin
from .models import Project
from .serializers import ProjectSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class ProjectViewSet(RecordPageViewMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["status"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "start_date", "title"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
