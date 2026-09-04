export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  /** Permite que el primer arranque cree el usuario; después se puede cerrar el registro. */
  allowRegistration: boolean;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env y rellénala.`,
    );
  }
  return value;
}

function buildDatabaseUrl(): string {
  // Coolify y Docker Compose inyectan DATABASE_URL; en local se arma con las piezas sueltas.
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const user = process.env.DB_USER ?? 'presupuesto';
  const pass = process.env.DB_PASSWORD ?? 'presupuesto';
  const name = process.env.DB_NAME ?? 'presupuesto';
  return `postgres://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`;
}

export default (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: buildDatabaseUrl(),
  jwtSecret: requireEnv('JWT_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-secret-no-usar-en-produccion'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200').split(',').map((s) => s.trim()),
  allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
});
