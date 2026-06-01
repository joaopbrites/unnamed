from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="destinatário",
    )
    verb = models.CharField(max_length=255, verbose_name="ação")

    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="tipo do alvo",
    )
    target_object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="ID do alvo")
    target = GenericForeignKey("target_content_type", "target_object_id")

    is_read = models.BooleanField(default=False, verbose_name="lida")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "notificação"
        verbose_name_plural = "notificações"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.verb}"
