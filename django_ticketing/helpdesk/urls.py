from django.urls import path

from .views import (
    DashboardView,
    TicketCommentCreateView,
    TicketCreateView,
    TicketDeleteView,
    TicketDetailView,
    TicketListView,
    TicketUpdateView,
)

app_name = "helpdesk"

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("tickets/", TicketListView.as_view(), name="ticket-list"),
    path("tickets/new/", TicketCreateView.as_view(), name="ticket-create"),
    path("tickets/<int:pk>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<int:pk>/edit/", TicketUpdateView.as_view(), name="ticket-update"),
    path("tickets/<int:pk>/delete/", TicketDeleteView.as_view(), name="ticket-delete"),
    path("tickets/<int:pk>/comment/", TicketCommentCreateView.as_view(), name="ticket-comment-create"),
]
