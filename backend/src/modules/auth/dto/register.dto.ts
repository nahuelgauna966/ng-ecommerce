import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// A propósito NO incluye `role`: el registro público siempre crea un usuario
// CUSTOMER (el valor por defecto de la entity). Asignar roles de admin es una
// operación de administración (UsersController), nunca algo que el propio
// usuario pueda elegir al registrarse (evita escalada de privilegios).
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
