from django import forms

from .models import Ticket, TicketComment


class TicketForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = ["title", "description", "priority", "status", "assigned_to"]


class TicketCommentForm(forms.ModelForm):
    class Meta:
        model = TicketComment
        fields = ["body"]
        widgets = {
            "body": forms.Textarea(attrs={"rows": 3, "placeholder": "Write an update..."}),
        }
