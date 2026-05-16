from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "start_date", "end_date", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description")
    ordering = ("start_date",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("title", "description", "image")}),
        ("Período", {"fields": ("start_date", "end_date")}),
        ("Status", {"fields": ("status", "created_by")}),
        ("Datas", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
