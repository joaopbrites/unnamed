from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    target_str = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id", "verb", "is_read", "created_at",
            "target_content_type", "target_object_id", "target_str",
        ]
        read_only_fields = fields

    def get_target_str(self, obj):
        if obj.target_content_type:
            return f"{obj.target_content_type.app_label}.{obj.target_content_type.model}"
        return None
