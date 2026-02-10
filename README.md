# Django IT Support Ticket System

This repository now includes a complete Python + Django ticketing application in `django_ticketing/`.

## Application features
- Authentication (login/logout) using Django auth.
- Dashboard with ticket status counters.
- Ticket CRUD (create, list, detail, update, delete).
- Assignment and priority/status management.
- Ticket comments for collaboration.
- Django admin support for Tickets and Comments.

## Project structure
- `django_ticketing/config/` — project configuration (settings/urls/asgi/wsgi)
- `django_ticketing/helpdesk/` — core ticketing app (models, views, forms, admin, tests)
- `django_ticketing/templates/` — base, auth, and helpdesk templates
- `django_ticketing/static/` — application stylesheet

## Quick start
```bash
cd django_ticketing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open http://127.0.0.1:8000.

## Test
```bash
cd django_ticketing
python manage.py test
```
