from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from apps.events.models import Event, EventRegistration
from apps.projects.models import Project
from apps.announcements.models import Announcement
from apps.comments.models import Comment
from .models import PageView

User = get_user_model()


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        return Response({
            "total_members": User.objects.count(),
            "total_events": Event.objects.count(),
            "total_projects": Project.objects.count(),
            "total_announcements": Announcement.objects.count(),
            "total_comments": Comment.objects.count(),
            "total_registrations": EventRegistration.objects.count(),
            "total_pageviews": PageView.objects.count(),
            "pageviews_last_7_days": PageView.objects.filter(
                created_at__gte=now - timezone.timedelta(days=7)
            ).count(),
            "pageviews_last_30_days": PageView.objects.filter(
                created_at__gte=now - timezone.timedelta(days=30)
            ).count(),
        })


class PageViewHistoryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        since = timezone.now() - timezone.timedelta(days=days)

        data = (
            PageView.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        return Response([
            {"day": str(entry["day"]), "count": entry["count"]}
            for entry in data
        ])
