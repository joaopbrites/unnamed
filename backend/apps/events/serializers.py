from rest_framework import serializers
from .models import Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    registrations_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "date", "location",
            "image", "status", "created_by", "created_at", "registrations_count",
        ]
        read_only_fields = ["created_by", "created_at"]

    def get_registrations_count(self, obj):
        return obj.registrations.count()


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ["id", "user", "event", "registered_at"]
        read_only_fields = ["user", "event", "registered_at"]
