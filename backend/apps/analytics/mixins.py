from django.contrib.contenttypes.models import ContentType
from .models import PageView


class RecordPageViewMixin:
    """Registra um PageView a cada acesso ao endpoint de detalhe (retrieve)."""

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        obj = self.get_object()
        PageView.objects.create(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.pk,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self._get_client_ip(request),
        )
        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
