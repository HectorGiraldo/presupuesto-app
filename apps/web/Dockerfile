# Se construye desde la RAÍZ del monorepo (contexto = .), igual que la API,
# porque el workspace necesita ver packages/shared y apps/web a la vez.
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @presupuesto/shared \
 && npm run build -w @presupuesto/web -- --configuration production

# --- Runtime: nginx sirviendo los ficheros estáticos ya compilados ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
