#!/bin/sh
set -e

echo "Aguardando o banco de dados..."
max=30
i=0
until python - <<'EOF' 2>/dev/null
import os, sys
from urllib.parse import urlparse

url = os.environ.get('DATABASE_URL', '')
if not url:
    sys.exit(0)

p = urlparse(url)
import psycopg2
try:
    psycopg2.connect(
        host=p.hostname, port=p.port or 5432,
        dbname=p.path.lstrip('/'), user=p.username, password=p.password,
        connect_timeout=3,
    ).close()
    sys.exit(0)
except Exception:
    sys.exit(1)
EOF
do
    i=$((i+1))
    if [ "$i" -ge "$max" ]; then
        echo "Banco não respondeu após ${max} tentativas. Abortando."
        exit 1
    fi
    echo "  tentativa $i/$max — aguardando 2s..."
    sleep 2
done

echo "Banco disponível. Executando migrations..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --clear

echo "Criando superusuário padrão (se necessário)..."
python manage.py create_default_superuser

echo "Iniciando gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
