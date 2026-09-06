import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/auth.service';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

/**
 * Extrae el usuario autenticado (payload del JWT: sub, email, role) que
 * JwtAuthGuard/JwtStrategy dejan en req.user.
 * Uso: @CurrentUser() user: JwtPayload, o @CurrentUser('sub') userId: number.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return data ? request.user?.[data] : request.user;
  },
);
