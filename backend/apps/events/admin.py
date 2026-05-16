from django.contrib import admin
from .models import Event, EventRegistration


class EventRegistrationInline(admin.TabularInline):
    model = EventRegistration
    extra = 0
    readonly_fields = ("registered_at",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "date", "location", "status", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description", "location")
    ordering = ("date",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [EventRegistrationInline]
    fieldsets = (
        (None, {"fields": ("title", "description", "image")}),
        ("Quando e onde", {"fields": ("date", "location")}),
        ("Status", {"fields": ("status", "created_by")}),
        ("Datas", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "registered_at")
    list_filter = ("event",)
    search_fields = ("user__username", "event__title")
    readonly_fields = ("registered_at",)
