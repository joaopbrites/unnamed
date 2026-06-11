import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = 'Cria um superusuário padrão se nenhum existir (usa variáveis de ambiente).'

    def handle(self, *args, **kwargs):
        password = os.environ.get('SUPERUSER_PASSWORD')
        if not password:
            self.stdout.write(self.style.WARNING(
                'SUPERUSER_PASSWORD não definida. Pulando criação do superusuário.'
            ))
            return

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.SUCCESS(
                'Superusuário já existe. Nenhuma ação necessária.'
            ))
            return

        username = os.environ.get('SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('SUPERUSER_EMAIL', 'admin@sdsc.local')
        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(
            f'Superusuário "{username}" criado com sucesso.'
        ))
