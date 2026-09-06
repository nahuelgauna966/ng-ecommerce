import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/user.entity';
import { JwtPayload } from '../../modules/auth/auth.service';

/**
 * Debe usarse SIEMPRE después de JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard),
 * ya que depende de request.user (payload del JWT) para conocer el rol.
 * Si el handler/controller no tiene @Roles(...), no restringe nada (allow-all).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    return !!user && requiredRoles.includes(user.role as UserRole);
  }
}
