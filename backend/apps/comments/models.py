from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Comment(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="autor",
    )
    # GenericFK — permite comentar em Event, Project ou Announcement
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        verbose_name="resposta a",
    )

    text = models.TextField(verbose_name="texto")
    is_reported = models.BooleanField(default=False, verbose_name="denunciado")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "comentário"
        verbose_name_plural = "comentários"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author} em {self.content_type} #{self.object_id}"


class CommentReaction(models.Model):
    REACTION_CHOICES = [
        ("like", "Gostei"),
        ("dislike", "Não gostei"),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_reactions",
        verbose_name="autor",
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="reactions",
        verbose_name="comentário",
    )
    reaction_type = models.CharField(
        max_length=10, choices=REACTION_CHOICES, verbose_name="tipo"
    )

    class Meta:
        verbose_name = "reação"
        verbose_name_plural = "reações"
        unique_together = [["author", "comment"]]

    def __str__(self):
        return f"{self.author} → {self.reaction_type} em comentário #{self.comment_id}"
