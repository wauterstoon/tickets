from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import generic

from .forms import TicketCommentForm, TicketForm
from .models import Ticket


class DashboardView(LoginRequiredMixin, generic.TemplateView):
    template_name = "helpdesk/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        qs = Ticket.objects.select_related("created_by", "assigned_to")
        context["open_count"] = qs.filter(status=Ticket.Status.OPEN).count()
        context["in_progress_count"] = qs.filter(status=Ticket.Status.IN_PROGRESS).count()
        context["resolved_count"] = qs.filter(status=Ticket.Status.RESOLVED).count()
        context["my_tickets"] = qs.filter(Q(created_by=self.request.user) | Q(assigned_to=self.request.user))[:5]
        return context


class TicketListView(LoginRequiredMixin, generic.ListView):
    model = Ticket
    template_name = "helpdesk/ticket_list.html"
    context_object_name = "tickets"
    paginate_by = 10

    def get_queryset(self):
        queryset = Ticket.objects.select_related("created_by", "assigned_to")
        search = self.request.GET.get("q", "").strip()
        status = self.request.GET.get("status", "").strip()

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class TicketDetailView(LoginRequiredMixin, generic.DetailView):
    model = Ticket
    template_name = "helpdesk/ticket_detail.html"
    context_object_name = "ticket"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["comment_form"] = TicketCommentForm()
        return context


class TicketCreateView(LoginRequiredMixin, generic.CreateView):
    model = Ticket
    form_class = TicketForm
    template_name = "helpdesk/ticket_form.html"
    success_url = reverse_lazy("helpdesk:ticket-list")

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        form.fields["assigned_to"].queryset = User.objects.order_by("username")
        return form

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class TicketUpdateView(LoginRequiredMixin, generic.UpdateView):
    model = Ticket
    form_class = TicketForm
    template_name = "helpdesk/ticket_form.html"

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        form.fields["assigned_to"].queryset = User.objects.order_by("username")
        return form

    def get_success_url(self):
        return reverse_lazy("helpdesk:ticket-detail", kwargs={"pk": self.object.pk})


class TicketDeleteView(LoginRequiredMixin, generic.DeleteView):
    model = Ticket
    template_name = "helpdesk/ticket_confirm_delete.html"
    success_url = reverse_lazy("helpdesk:ticket-list")


class TicketCommentCreateView(LoginRequiredMixin, generic.View):
    def post(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        form = TicketCommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.ticket = ticket
            comment.author = request.user
            comment.save()
        return redirect("helpdesk:ticket-detail", pk=pk)
