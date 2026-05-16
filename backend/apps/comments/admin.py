from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("author", "content_type", "object_id", "created_at")
    list_filter = ("content_type",)
    search_fields = ("author__username", "text")
    readonly_fields = ("created_at", "updated_at", "content_type", "object_id")
