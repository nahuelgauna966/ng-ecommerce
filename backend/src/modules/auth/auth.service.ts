import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface AccessTokenResponse {
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async login(dto: LoginDto): Promise<AccessTokenResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // Mensaje genérico a propósito: no revelar si falló el email o el
    // password (evita enumeración de usuarios registrados).
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
