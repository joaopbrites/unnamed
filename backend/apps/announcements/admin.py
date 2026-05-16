from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "is_pinned", "created_by", "created_at")
    list_filter = ("category", "is_pinned")
    search_fields = ("title", "content")
    ordering = ("-is_pinned", "-created_at")
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("is_pinned",)
    fieldsets = (
        (None, {"fields": ("title", "content")}),
        ("Classificação", {"fields": ("category", "is_pinned", "created_by")}),
        ("Datas", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
