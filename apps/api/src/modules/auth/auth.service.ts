import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthResponse } from '@presupuesto/shared';
import { UserEntity } from '../../database/entities';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly categories: CategoriesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const registrationOpen = this.config.get<boolean>('allowRegistration');
    const existingUsers = await this.users.count();
    // El primer usuario siempre puede registrarse (si no, la app recién desplegada
    // quedaría inaccesible); a partir de ahí manda ALLOW_REGISTRATION.
    if (existingUsers > 0 && !registrationOpen) {
      throw new BadRequestException('El registro está cerrado');
    }

    if (await this.users.findByEmail(dto.email)) {
      throw new BadRequestException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ email: dto.email, passwordHash, name: dto.name });

    // Sin categorías la app no sirve para nada, así que se siembran al crear la cuenta.
    await this.categories.seedDefaults(user.id);

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    // Mismo mensaje para email inexistente y contraseña incorrecta: no hay que
    // revelar qué emails están registrados.
    const invalid = new UnauthorizedException('Email o contraseña incorrectos');
    if (!user) throw invalid;

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) throw invalid;

    return this.buildResponse(user);
  }

  private buildResponse(user: UserEntity): AuthResponse {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency ?? 'EUR',
        locale: user.locale ?? 'es-ES',
      },
    };
  }
}
