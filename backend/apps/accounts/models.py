from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    is_member = models.BooleanField(default=True, verbose_name="é membro")
    bio = models.TextField(blank=True, default="", verbose_name="bio")
    phone = models.CharField(max_length=20, blank=True, default="", verbose_name="telefone")

    class Meta:
        verbose_name = "usuário"
        verbose_name_plural = "usuários"

    def __str__(self):
        return self.username
