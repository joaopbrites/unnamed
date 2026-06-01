from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Comment, CommentReaction
from .serializers import CommentSerializer

VALID_REACTION_TYPES = {choice[0] for choice in CommentReaction.REACTION_CHOICES}


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
        qs = Comment.objects.select_related("author", "content_type").prefetch_related(
            "replies", "reactions"
        )
        content_type_str = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")

        if content_type_str and object_id:
            try:
                app_label, model = content_type_str.lower().split(".")
                ct = ContentType.objects.get(app_label=app_label, model=model)
                qs = qs.filter(content_type=ct, object_id=object_id, parent=None)
            except (ValueError, ContentType.DoesNotExist):
                return Comment.objects.none()
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def replies(self, request, pk=None):
        comment = self.get_object()
        qs = comment.replies.select_related("author").prefetch_related("replies", "reactions")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, pk=None):
        comment = self.get_object()
        reaction_type = request.data.get("reaction_type")

        if reaction_type not in VALID_REACTION_TYPES:
            return Response(
                {"detail": f"Tipo inválido. Use: {', '.join(VALID_REACTION_TYPES)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = CommentReaction.objects.filter(
            author=request.user, comment=comment
        ).first()

        if existing:
            if existing.reaction_type == reaction_type:
                existing.delete()
                return Response({"detail": "Reação removida."}, status=status.HTTP_200_OK)
            existing.reaction_type = reaction_type
            existing.save()
            return Response({"detail": f"Reação atualizada para {reaction_type}."}, status=status.HTTP_200_OK)

        CommentReaction.objects.create(
            author=request.user, comment=comment, reaction_type=reaction_type
        )
        return Response(
            {"detail": f"Reação '{reaction_type}' registrada."},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def report(self, request, pk=None):
        comment = self.get_object()
        comment.is_reported = True
        comment.save(update_fields=["is_reported"])
        return Response({"detail": "Comentário denunciado."}, status=status.HTTP_200_OK)
