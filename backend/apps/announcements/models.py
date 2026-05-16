from django.db import models
from django.conf import settings


class Announcement(models.Model):
    CATEGORY_CHOICES = [
        ("general", "Geral"),
        ("meeting", "Reunião"),
        ("maintenance", "Manutenção"),
        ("sports", "Esportes"),
        ("social", "Social"),
        ("urgent", "Urgente"),
    ]

    title = models.CharField(max_length=200, verbose_name="título")
    content = models.TextField(verbose_name="conteúdo")
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="general", verbose_name="categoria"
    )
    is_pinned = models.BooleanField(default=False, verbose_name="fixado")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_announcements",
        verbose_name="criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "anúncio"
        verbose_name_plural = "anúncios"
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return self.title
