import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'María González',
    minLength: 2,
    description: 'Nuevo nombre completo del usuario.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    example: 'maria.gonzalez@example.com',
    format: 'email',
    description: 'Nuevo correo electrónico único del usuario.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'nuevaClave123',
    minLength: 8,
    format: 'password',
    writeOnly: true,
    description: 'Nueva contraseña de al menos 8 caracteres.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    example: 'segura123',
    minLength: 1,
    format: 'password',
    writeOnly: true,
    description:
      'Contraseña actual; es obligatoria si se envía una nueva contraseña.',
  })
  @ValidateIf((object: UpdateProfileDto) => Boolean(object.password))
  @IsString()
  @MinLength(1)
  currentPassword?: string;
}
