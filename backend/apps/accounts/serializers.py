from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "bio")
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    recent_registrations = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "first_name", "last_name", "bio",
            "date_joined", "recent_registrations", "recent_comments",
        )
        read_only_fields = fields

    def get_recent_registrations(self, obj):
        from apps.events.serializers import EventRegistrationSerializer
        regs = obj.event_registrations.select_related("event").order_by("-registered_at")[:5]
        return EventRegistrationSerializer(regs, many=True).data

    def get_recent_comments(self, obj):
        from apps.comments.serializers import CommentSerializer
        comments = obj.comments.order_by("-created_at")[:5]
        return CommentSerializer(comments, many=True, context=self.context).data
