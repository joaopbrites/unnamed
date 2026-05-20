from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Comment


class ContentTypeField(serializers.Field):
    """Aceita e retorna content_type no formato 'app_label.model' (ex: 'events.event')."""

    def to_representation(self, value):
        return f"{value.app_label}.{value.model}"

    def to_internal_value(self, data):
        try:
            app_label, model = str(data).lower().split(".")
            return ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError(
                f"Tipo de conteúdo inválido: '{data}'. Use o formato 'app.model' (ex: 'events.event')."
            )


class CommentSerializer(serializers.ModelSerializer):
    content_type = ContentTypeField()
    author_username = serializers.ReadOnlyField(source="author.username")

    class Meta:
        model = Comment
        fields = [
            "id", "author", "author_username",
            "content_type", "object_id",
            "text", "created_at",
        ]
        read_only_fields = ["author", "author_username", "created_at"]

