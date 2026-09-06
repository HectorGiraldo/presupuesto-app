import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Liveness check para el healthcheck del contenedor (Docker / Coolify).
 * A propósito NO toca la base de datos: solo dice "el proceso está vivo y
 * responde". Si comprobara la BD, un corte momentáneo marcaría el contenedor
 * como unhealthy y podría entrar en bucle de reinicios.
 */
@Controller('health')
@Public()
export class HealthController {
  @Get()
  check(): { status: string; uptime: number } {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}
