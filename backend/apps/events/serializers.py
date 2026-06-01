from rest_framework import serializers
from .models import Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    registrations_count = serializers.SerializerMethodField()
    confirmed_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "date", "location",
            "image", "status", "capacity", "created_by", "created_at",
            "registrations_count", "confirmed_count",
        ]
        read_only_fields = ["created_by", "created_at"]

    def get_registrations_count(self, obj):
        return obj.registrations.count()

    def get_confirmed_count(self, obj):
        return obj.registrations.filter(status="confirmed").count()


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ["id", "user", "event", "status", "registered_at"]
        read_only_fields = ["user", "event", "status", "registered_at"]
