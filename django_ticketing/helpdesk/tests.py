from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from .models import Ticket


class TicketFlowTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(username="alice", password="changeme123")

    def test_ticket_creation(self):
        self.client.login(username="alice", password="changeme123")
        response = self.client.post(
            reverse("helpdesk:ticket-create"),
            {
                "title": "Cannot connect to VPN",
                "description": "VPN fails with timeout error.",
                "priority": Ticket.Priority.HIGH,
                "status": Ticket.Status.OPEN,
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Ticket.objects.count(), 1)

    def test_dashboard_requires_auth(self):
        response = self.client.get(reverse("helpdesk:dashboard"))
        self.assertEqual(response.status_code, 302)
