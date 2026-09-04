#!/bin/sh
set -e

# Aplica las migraciones pendientes antes de arrancar (usa el data-source ya
# compilado a JS, sin necesitar ts-node en producción). Es idempotente: si ya
# están todas aplicadas, no hace nada. Así un redeploy en Coolify siempre deja
# el esquema al día sin pasos manuales.
echo "Aplicando migraciones..."
node node_modules/typeorm/cli.js migration:run -d apps/api/dist/database/data-source.js

echo "Arrancando API..."
exec node apps/api/dist/main.js
