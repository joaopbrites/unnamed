from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "verb", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__username", "verb")
    readonly_fields = ("user", "verb", "target_content_type", "target_object_id", "created_at")
    date_hierarchy = "created_at"
    actions = ["mark_as_read"]

    @admin.action(description="Marcar como lidas")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
