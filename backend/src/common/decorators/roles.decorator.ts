import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Marca un handler/controller con los roles permitidos.
 * Uso: @Roles(UserRole.ADMIN) — se evalúa en RolesGuard.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
