import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'Ana Pérez',
    minLength: 1,
    description: 'Nombre completo del usuario.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'ana.perez@example.com',
    format: 'email',
    description: 'Correo electrónico único del usuario.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'segura123',
    minLength: 6,
    format: 'password',
    writeOnly: true,
    description: 'Contraseña de al menos 6 caracteres.',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CUSTOMER,
    default: UserRole.CUSTOMER,
    description: 'Rol asignado al usuario.',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
