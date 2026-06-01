from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Comment, CommentReaction


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
    replies_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "author", "author_username",
            "content_type", "object_id",
            "parent",
            "text", "is_reported",
            "replies_count", "likes_count", "dislikes_count", "user_reaction",
            "created_at",
        ]
        read_only_fields = ["author", "author_username", "is_reported", "created_at"]

    def get_replies_count(self, obj):
        return obj.replies.count()

    def get_likes_count(self, obj):
        return obj.reactions.filter(reaction_type="like").count()

    def get_dislikes_count(self, obj):
        return obj.reactions.filter(reaction_type="dislike").count()

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(author=request.user).first()
            return reaction.reaction_type if reaction else None
        return None


class CommentReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReaction
        fields = ["id", "author", "comment", "reaction_type"]
        read_only_fields = ["author", "comment"]
