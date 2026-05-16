from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.events.models import Event, EventRegistration

User = get_user_model()


class EventModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Festa Junina",
            description="Festa junina do bairro",
            date=timezone.now() + timezone.timedelta(days=10),
            location="Quadra da Associação",
            created_by=self.admin,
        )

    def test_event_str(self):
        self.assertEqual(str(self.event), "Festa Junina")

    def test_event_default_status_is_upcoming(self):
        self.assertEqual(self.event.status, "upcoming")

    def test_event_has_created_at(self):
        self.assertIsNotNone(self.event.created_at)

    def test_event_ordering_by_date(self):
        later = Event.objects.create(
            title="Evento Futuro",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=30),
            location="Local",
            created_by=self.admin,
        )
        events = list(Event.objects.all())
        self.assertEqual(events[0], self.event)
        self.assertEqual(events[1], later)


class EventRegistrationModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin2", email="admin2@test.com", password="admin123"
        )
        self.user = User.objects.create_user(
            username="membro2", email="membro2@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Torneio de Futebol",
            description="Torneio anual",
            date=timezone.now() + timezone.timedelta(days=5),
            location="Campo",
            created_by=self.admin,
        )

    def test_registration_str(self):
        reg = EventRegistration.objects.create(user=self.user, event=self.event)
        self.assertIn("membro2", str(reg))
        self.assertIn("Torneio de Futebol", str(reg))

    def test_registration_unique_per_user_event(self):
        EventRegistration.objects.create(user=self.user, event=self.event)
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            EventRegistration.objects.create(user=self.user, event=self.event)

    def test_registration_has_registered_at(self):
        reg = EventRegistration.objects.create(user=self.user, event=self.event)
        self.assertIsNotNone(reg.registered_at)
