/**
 * Base de todas las URLs de la API. `API_BASE_URL` se sustituye en tiempo de
 * build (esbuild `--define`, configurado en angular.json) — por defecto
 * '/api' para desarrollo local (el proxy de `ng serve` lo reenvía a la API
 * local); en el build de producción, el Dockerfile de `web` la sobreescribe
 * con la URL pública real del recurso `api` en Coolify. Así el navegador
 * llama directo a `api` (con CORS habilitado en el backend) sin necesitar
 * que nginx haga de proxy intermedio.
 */
declare const API_BASE_URL: string;

export const API_BASE: string = API_BASE_URL;
