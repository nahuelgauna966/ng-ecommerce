import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// A propósito NO incluye `role`: el registro público siempre crea un usuario
// CUSTOMER (el valor por defecto de la entity). Asignar roles de admin es una
// operación de administración (UsersController), nunca algo que el propio
// usuario pueda elegir al registrarse (evita escalada de privilegios).
export class RegisterDto {
  @ApiProperty({
    example: 'María González',
    minLength: 1,
    description: 'Nombre completo de la persona que se registra.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'maria.gonzalez@example.com',
    format: 'email',
    description: 'Correo electrónico único de la cuenta.',
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
}
