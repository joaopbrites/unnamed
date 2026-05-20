from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Comment
from .serializers import CommentSerializer


class IsAuthorOrAdmin(permissions.BasePermission):
    """Permite leitura a todos; escrita somente ao autor ou admin."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrAdmin]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Comment.objects.select_related("author", "content_type")
        content_type_str = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")
        if content_type_str and object_id:
            try:
                app_label, model = content_type_str.lower().split(".")
                ct = ContentType.objects.get(app_label=app_label, model=model)
                qs = qs.filter(content_type=ct, object_id=object_id)
            except (ValueError, ContentType.DoesNotExist):
                return Comment.objects.none()
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

