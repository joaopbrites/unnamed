from django.contrib import admin
from .models import Comment, CommentReaction


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("author", "content_type", "object_id", "is_reported", "parent", "created_at")
    list_filter = ("content_type", "is_reported")
    search_fields = ("author__username", "text")
    readonly_fields = ("created_at", "updated_at", "content_type", "object_id")
    actions = ["clear_report_flag"]

    @admin.action(description="Limpar flag de denúncia")
    def clear_report_flag(self, request, queryset):
        queryset.update(is_reported=False)


@admin.register(CommentReaction)
class CommentReactionAdmin(admin.ModelAdmin):
    list_display = ("author", "comment", "reaction_type")
    list_filter = ("reaction_type",)
    search_fields = ("author__username",)
    readonly_fields = ("author", "comment", "reaction_type")
