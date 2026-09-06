import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protege rutas exigiendo un JWT válido en el header Authorization: Bearer.
 * Delega en la estrategia 'jwt' (JwtStrategy) registrada en AuthModule.
 * Uso: @UseGuards(JwtAuthGuard) sobre un controller o handler.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
