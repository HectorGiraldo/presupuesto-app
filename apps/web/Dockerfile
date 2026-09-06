# Se construye desde la RAÍZ del monorepo (contexto = .), igual que la API,
# porque el workspace necesita ver packages/shared y apps/web a la vez.
FROM node:22-alpine AS build
WORKDIR /repo

# URL completa donde vivirá la API, INCLUYENDO el prefijo /api (ej.
# "https://api-xxxxx.sslip.io/api" o "https://api.tudominio.com/api", sin
# barra final después de "/api"). Se compila dentro del bundle de Angular (no
# es una variable de entorno en tiempo de ejecución) porque el resultado de
# "ng build" son ficheros estáticos servidos por nginx; por eso es un ARG de
# build y no un ENV. Por defecto '/api', que es lo que necesita
# el docker-compose de desarrollo local (todo bajo el mismo origen).
ARG API_BASE_URL=/api

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @presupuesto/shared \
 && npm run build -w @presupuesto/web -- --configuration production --define "API_BASE_URL='${API_BASE_URL}'"

# --- Runtime: nginx sirviendo los ficheros estáticos ya compilados ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
