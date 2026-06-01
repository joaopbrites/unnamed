from django.contrib import admin
from .models import PageView


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ("content_type", "object_id", "user", "ip_address", "created_at")
    list_filter = ("content_type", "created_at")
    search_fields = ("ip_address", "user__username")
    readonly_fields = ("content_type", "object_id", "user", "ip_address", "created_at")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
