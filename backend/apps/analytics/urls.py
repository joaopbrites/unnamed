from django.urls import path
from .views import AnalyticsSummaryView, PageViewHistoryView

urlpatterns = [
    path("summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("pageviews/", PageViewHistoryView.as_view(), name="analytics-pageviews"),
]
