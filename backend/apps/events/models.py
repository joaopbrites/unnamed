from django.db import models
from django.conf import settings


class Event(models.Model):
    STATUS_CHOICES = [
        ("upcoming", "Em breve"),
        ("ongoing", "Em andamento"),
        ("completed", "Encerrado"),
        ("cancelled", "Cancelado"),
    ]

    title = models.CharField(max_length=200, verbose_name="título")
    description = models.TextField(verbose_name="descrição")
    date = models.DateTimeField(verbose_name="data e hora")
    location = models.CharField(max_length=300, verbose_name="local")
    image = models.ImageField(
        upload_to="events/", blank=True, null=True, verbose_name="imagem"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="upcoming", verbose_name="status"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_events",
        verbose_name="criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "evento"
        verbose_name_plural = "eventos"
        ordering = ["date"]

    def __str__(self):
        return self.title


class EventRegistration(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_registrations",
        verbose_name="usuário",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="registrations",
        verbose_name="evento",
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "inscrição"
        verbose_name_plural = "inscrições"
        unique_together = [["user", "event"]]

    def __str__(self):
        return f"{self.user} → {self.event}"
