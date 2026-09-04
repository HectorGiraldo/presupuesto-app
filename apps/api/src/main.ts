import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string[]>('corsOrigins'), credentials: true });

  // whitelist: descarta campos no declarados en el DTO en vez de guardarlos a ciegas.
  // transform: convierte query params (strings) a number/boolean según el DTO.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const port = config.get<number>('port', 3000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API escuchando en el puerto ${port}`);
}

bootstrap();
