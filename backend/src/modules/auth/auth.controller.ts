import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { AuthService, AccessTokenResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'Usuario registrado correctamente.' })
  @ApiBadRequestResponse({
    description: 'Los datos enviados no cumplen las validaciones.',
    type: HttpErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe una cuenta con el correo electrónico indicado.',
    type: HttpErrorResponseDto,
  })
  register(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Autenticación realizada correctamente.' })
  @ApiBadRequestResponse({
    description: 'Los datos enviados no cumplen las validaciones.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'El correo, la contraseña o el estado de la cuenta no son válidos.',
    type: HttpErrorResponseDto,
  })
  login(@Body() dto: LoginDto): Promise<AccessTokenResponse> {
    return this.authService.login(dto);
  }
}
