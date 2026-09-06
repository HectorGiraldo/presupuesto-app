# 💰 Mi Presupuesto

Aplicación personal de presupuesto mensual y anual, pensada para tomar el control
real de las finanzas: cuentas, movimientos, presupuesto por categoría con
semáforo de aviso, gastos recurrentes, metas de ahorro, deudas con cuadro de
amortización, vista anual y reportes. Todo en euros y en español.

## Funcionalidades

- **Cuentas y movimientos**: ingresos, gastos y traspasos entre cuentas propias,
  con filtros por fecha, cuenta, categoría y texto.
- **Categorías**: catálogo español sembrado por defecto, con subcategorías y un
  flag de "esencial" que alimenta el análisis 50/30/20.
- **Presupuesto mensual**: objetivo por categoría con semáforo de progreso
  (bien / atención / superado) y copia rápida del mes anterior.
- **Recurrentes**: gastos e ingresos fijos (alquiler, nómina, suscripciones...)
  que se generan solos cada mes o quedan pendientes de confirmar.
- **Metas de ahorro**: con cálculo automático de cuánto aportar al mes para
  llegar a la fecha objetivo.
- **Deudas**: hipotecas, préstamos y tarjetas con cuadro de amortización
  (sistema francés) y registro de pagos que descuenta de la cuenta real.
- **Vista anual**: resumen mes a mes y mapa de calor de gasto por categoría.
- **Reportes**: reparto 50/30/20, tendencia por categoría, flujo de caja /
  patrimonio.
- **Copia de seguridad**: exportar e importar todos los datos en un único JSON.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (standalone, zoneless, signals) |
| Backend | NestJS 11 + TypeORM |
| Base de datos | PostgreSQL 16 |
| Monorepo | npm workspaces |
| Despliegue | Docker, un recurso por servicio (Postgres, api, web) |

## Estructura del proyecto

```
presupuesto-app/
├─ apps/
│  ├─ api/      # Backend NestJS
│  └─ web/      # Frontend Angular
├─ packages/
│  └─ shared/   # Tipos, DTOs y utilidades compartidas entre api y web
└─ docker-compose.yml   # Solo para desarrollo local / probar el stack completo
```

## Desarrollo local

Requisitos: Node 20+, Docker (para Postgres, o tu propia instancia).

```bash
# 1. Instalar dependencias del monorepo
npm install

# 2. Levantar Postgres
docker compose up -d postgres

# 3. Configurar variables de entorno
cp .env.example .env
# edita .env si hace falta (contraseñas, JWT_SECRET...)

# 4. Aplicar las migraciones
npm run migration:run

# 5. (Opcional) Sembrar un usuario de prueba con 3 meses de movimientos
npm run seed -w @presupuesto/api

# 6. Arrancar API + web con recarga en caliente
npm run dev
```

La web queda en `http://localhost:4200` (con proxy a la API en `http://localhost:3000`).

### Probar el stack completo en Docker (local)

```bash
docker compose up -d --build
```

Levanta `postgres`, `api` (puerto 3000) y `web` (puerto 80). Aquí el navegador
llama **directo** a `http://localhost:3000` — no hay proxy de por medio —, con
CORS habilitado en la API para el origen de `web`. Es el mismo modelo que en
producción, solo que con dominios locales.

## Despliegue en Coolify

Cada servicio es un **recurso independiente** en Coolify (nada de desplegar el
`docker-compose.yml` como stack — el soporte de Coolify para Docker Compose
desde un repositorio git tiene bugs conocidos que impiden que lea el archivo).

1. **Base de datos**: *Resources → New → Databases → PostgreSQL*. Recurso
   nativo de Coolify: backups programables, sin mantenimiento propio. Copia el
   dato de conexión interno que te da (algo como
   `postgres://usuario:contraseña@host:5432/basededatos`).

2. **`api`**: *New Resource → Dockerfile* (o "Public Repository" y Coolify
   detecta el Dockerfile) → `Dockerfile Location`: `apps/api/Dockerfile`,
   `Base Directory`: `/` (la raíz del repo — el Dockerfile necesita ver
   también `packages/shared`). Variables de entorno:
   - `DATABASE_URL`: la del paso 1.
   - `JWT_SECRET`: cadena larga aleatoria.
   - `JWT_EXPIRES_IN=30d`, `ALLOW_REGISTRATION=true` (ciérralo tras crear tu usuario).
   - `CORS_ORIGINS`: el dominio que le vayas a poner a `web` (paso 3), ej.
     `https://presupuesto.tudominio.com`.

   Asígnale un dominio (o el `.sslip.io` gratuito que da Coolify) — lo
   necesita `web` para poder llamarla.

3. **`web`**: *New Resource → Dockerfile* → `Dockerfile Location`:
   `apps/web/Dockerfile`, `Base Directory`: `/`. En **Build Arguments** (no en
   variables de entorno normales: esto se compila dentro del bundle de
   Angular) añade:
   - `API_BASE_URL`: la URL pública de `api` del paso 2 **+ `/api`**, ej.
     `https://api-xxxxx.sslip.io/api`.

   Asígnale tu dominio real.

4. **Deploy** cada recurso (en el orden 1 → 2 → 3). Las migraciones de la base
   de datos se aplican automáticamente al arrancar `api`.

5. Regístrate en `web` con tu email real, y luego pon `ALLOW_REGISTRATION=false`
   en `api` y redeploy, para que nadie más pueda crear una cuenta.

Como el despliegue es manual (repositorio público sin la GitHub App, para no
depender de que Coolify reciba webhooks de GitHub), cada actualización es
pulsar **Deploy** en `api` y/o `web` tras hacer push.

## Scripts del monorepo

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca API y web en modo desarrollo |
| `npm run build` | Compila `shared`, `api` y `web` |
| `npm run db:up` / `db:down` | Levanta / para el Postgres local |
| `npm run migration:run` | Aplica migraciones pendientes |
| `npm run migration:generate` | Genera una migración a partir de cambios en las entidades |
