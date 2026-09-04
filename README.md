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
| Despliegue | Docker (nginx sirve Angular y hace de proxy de `/api` a NestJS bajo un único dominio) |

## Estructura del proyecto

```
presupuesto-app/
├─ apps/
│  ├─ api/      # Backend NestJS
│  └─ web/      # Frontend Angular
├─ packages/
│  └─ shared/   # Tipos, DTOs y utilidades compartidas entre api y web
├─ docker-compose.yml           # Base: sin puertos publicados (lo que usa Coolify)
└─ docker-compose.override.yml # Solo local: añade los puertos para abrir localhost
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

## Despliegue con Docker / Coolify

`docker-compose.yml` es la base y **no publica ningún puerto al host** — es
el archivo que se apunta tal cual en Coolify (o cualquier host donde un proxy
ya ocupe el 80/443). Si un servicio publicara un puerto con `host:contenedor`,
Coolify lo enlazaría literalmente en el servidor saltándose su propio proxy:
reventaría ese proxy en el caso de `web`, y dejaría la base de datos expuesta
a internet en el caso de `postgres`.

```bash
# Prueba local del stack completo (usa docker-compose.yml +
# docker-compose.override.yml automáticamente, así que sí expone puertos)
docker compose up -d --build
```

Levanta tres contenedores: `postgres`, `api` y `web`. El contenedor `web`
sirve el build de Angular con nginx y reenvía `/api` al contenedor `api`, así
que en producción solo hace falta publicar **un** dominio — no hay que
configurar CORS.

**En Coolify**: nuevo recurso → Docker Compose → repositorio público (o el que
uses) → "Docker Compose Location": `docker-compose.yml` (el de la raíz, sin
más). Asigna el dominio únicamente al servicio `web` desde la pestaña
Domains — `api` y `postgres` no lo necesitan, se hablan entre sí por nombre
de servicio dentro de la red que crea el propio stack.

Variables de entorno necesarias (ver `.env.example`): credenciales de la base
de datos y `JWT_SECRET`. Las migraciones se aplican automáticamente al arrancar
el contenedor de la API.

## Scripts del monorepo

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca API y web en modo desarrollo |
| `npm run build` | Compila `shared`, `api` y `web` |
| `npm run db:up` / `db:down` | Levanta / para el Postgres local |
| `npm run migration:run` | Aplica migraciones pendientes |
| `npm run migration:generate` | Genera una migración a partir de cambios en las entidades |
