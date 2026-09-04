# Se construye desde la RAÍZ del monorepo (contexto = .) porque el workspace
# necesita ver packages/shared y apps/api a la vez para instalar y compilar.
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @presupuesto/shared \
 && npm run build -w @presupuesto/api

# --- Runtime: solo lo necesario para ejecutar, sin herramientas de build ---
FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev

COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY apps/api/docker-entrypoint.sh apps/api/docker-entrypoint.sh
RUN chmod +x apps/api/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["apps/api/docker-entrypoint.sh"]
