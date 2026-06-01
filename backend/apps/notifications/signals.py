from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType


@receiver(post_save, sender="comments.Comment")
def notify_on_comment(sender, instance, created, **kwargs):
    if not created:
        return
    from .models import Notification

    content_object = instance.content_object
    if content_object is None:
        return

    owner = getattr(content_object, "created_by", None)
    if owner is None or owner == instance.author:
        return

    Notification.objects.create(
        user=owner,
        verb=f"{instance.author.username} comentou no seu conteúdo",
        target_content_type=ContentType.objects.get_for_model(instance),
        target_object_id=instance.pk,
    )


@receiver(post_save, sender="comments.CommentReaction")
def notify_on_reaction(sender, instance, created, **kwargs):
    if not created:
        return
    from .models import Notification

    comment_author = instance.comment.author
    if comment_author == instance.author:
        return

    Notification.objects.create(
        user=comment_author,
        verb=f"{instance.author.username} reagiu ao seu comentário com {instance.get_reaction_type_display().lower()}",
        target_content_type=ContentType.objects.get_for_model(instance.comment),
        target_object_id=instance.comment.pk,
    )


@receiver(post_save, sender="events.EventRegistration")
def notify_on_registration(sender, instance, created, **kwargs):
    if not created:
        return
    from .models import Notification

    event_creator = instance.event.created_by
    if event_creator is None or event_creator == instance.user:
        return

    Notification.objects.create(
        user=event_creator,
        verb=f"{instance.user.username} se inscreveu no seu evento",
        target_content_type=ContentType.objects.get_for_model(instance.event),
        target_object_id=instance.event.pk,
    )
