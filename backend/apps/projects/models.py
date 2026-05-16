from django.db import models
from django.conf import settings


class Project(models.Model):
    STATUS_CHOICES = [
        ("planning", "Em planejamento"),
        ("active", "Em andamento"),
        ("completed", "Concluído"),
        ("cancelled", "Cancelado"),
    ]

    title = models.CharField(max_length=200, verbose_name="título")
    description = models.TextField(verbose_name="descrição")
    start_date = models.DateField(verbose_name="data de início")
    end_date = models.DateField(blank=True, null=True, verbose_name="data de término")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="active", verbose_name="status"
    )
    image = models.ImageField(
        upload_to="projects/", blank=True, null=True, verbose_name="imagem"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_projects",
        verbose_name="criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "projeto"
        verbose_name_plural = "projetos"
        ordering = ["created_at"]

    def __str__(self):
        return self.title
