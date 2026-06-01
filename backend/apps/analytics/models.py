from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class PageView(models.Model):
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, verbose_name="tipo de conteúdo"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID do objeto")
    content_object = GenericForeignKey("content_type", "object_id")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="page_views",
        verbose_name="usuário",
    )
    ip_address = models.GenericIPAddressField(
        blank=True, null=True, verbose_name="endereço IP"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "visualização"
        verbose_name_plural = "visualizações"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.content_type} #{self.object_id} — {self.created_at:%Y-%m-%d %H:%M}"
