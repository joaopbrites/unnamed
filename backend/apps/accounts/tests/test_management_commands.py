from io import StringIO
from unittest import mock
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

User = get_user_model()


class CreateDefaultSuperuserTest(TestCase):
    def _call(self, env=None):
        out = StringIO()
        with mock.patch.dict('os.environ', env or {}, clear=False):
            call_command('create_default_superuser', stdout=out)
        return out.getvalue()

    def test_cria_superusuario_com_variaveis_definidas(self):
        out = self._call({
            'SUPERUSER_USERNAME': 'admintest',
            'SUPERUSER_EMAIL': 'admin@test.com',
            'SUPERUSER_PASSWORD': 'senhaSegura123',
        })
        self.assertTrue(User.objects.filter(username='admintest', is_superuser=True).exists())
        self.assertIn('admintest', out)

    def test_nao_cria_se_superusuario_ja_existe(self):
        User.objects.create_superuser(username='existente', email='e@test.com', password='pass')
        out = self._call({
            'SUPERUSER_USERNAME': 'outro',
            'SUPERUSER_EMAIL': 'outro@test.com',
            'SUPERUSER_PASSWORD': 'senhaSegura123',
        })
        self.assertEqual(User.objects.filter(is_superuser=True).count(), 1)
        self.assertIn('já existe', out)

    def test_nao_cria_sem_password(self):
        env = {'SUPERUSER_USERNAME': 'admin', 'SUPERUSER_EMAIL': 'a@test.com'}
        env.pop('SUPERUSER_PASSWORD', None)
        with mock.patch.dict('os.environ', env, clear=False):
            # garante que SUPERUSER_PASSWORD não está no ambiente
            import os
            os.environ.pop('SUPERUSER_PASSWORD', None)
            out = StringIO()
            call_command('create_default_superuser', stdout=out)
        self.assertFalse(User.objects.filter(is_superuser=True).exists())
        self.assertIn('SUPERUSER_PASSWORD', out.getvalue())

    def test_usa_valores_padrao_para_username_e_email(self):
        out = self._call({'SUPERUSER_PASSWORD': 'senhaSegura123'})
        self.assertTrue(User.objects.filter(username='admin', is_superuser=True).exists())

    def test_superusuario_pode_autenticar(self):
        self._call({
            'SUPERUSER_USERNAME': 'adminauth',
            'SUPERUSER_EMAIL': 'auth@test.com',
            'SUPERUSER_PASSWORD': 'senhaSegura123',
        })
        user = User.objects.get(username='adminauth')
        self.assertTrue(user.check_password('senhaSegura123'))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
