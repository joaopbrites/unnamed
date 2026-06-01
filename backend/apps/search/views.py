from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.events.models import Event
from apps.events.serializers import EventSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from apps.announcements.models import Announcement
from apps.announcements.serializers import AnnouncementSerializer


class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()

        if not q:
            return Response({"events": [], "projects": [], "announcements": []})

        events = Event.objects.filter(
            Q(title__icontains=q) | Q(description__icontains=q)
        )[:10]
        projects = Project.objects.filter(
            Q(title__icontains=q) | Q(description__icontains=q)
        )[:10]
        announcements = Announcement.objects.filter(
            Q(title__icontains=q) | Q(content__icontains=q)
        )[:10]

        return Response({
            "events": EventSerializer(events, many=True).data,
            "projects": ProjectSerializer(projects, many=True).data,
            "announcements": AnnouncementSerializer(announcements, many=True).data,
        })
