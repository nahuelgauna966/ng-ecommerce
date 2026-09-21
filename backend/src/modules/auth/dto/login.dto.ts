import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'maria.gonzalez@example.com',
    format: 'email',
    description: 'Correo electrónico de la cuenta.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'segura123',
    format: 'password',
    writeOnly: true,
    description: 'Contraseña de la cuenta.',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
