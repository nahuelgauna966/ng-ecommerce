import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginatedAdminUsers, UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserRole } from './user.entity';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil del usuario autenticado.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: HttpErrorResponseDto,
  })
  getProfile(@CurrentUser('sub') userId: number): Promise<User> {
    return this.usersService.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente.' })
  @ApiBadRequestResponse({
    description: 'Los datos enviados no cumplen las validaciones.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: HttpErrorResponseDto,
  })
  updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtros (solo admin)' })
  @ApiOkResponse({ description: 'Lista paginada de usuarios.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  findAll(@Query() query: AdminUsersQueryDto): Promise<PaginatedAdminUsers> {
    return this.usersService.findAllForAdmin(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de un usuario (solo admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Id del usuario.' })
  @ApiOkResponse({ description: 'Detalle del usuario.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: HttpErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOneForAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario (solo admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Id del usuario.' })
  @ApiOkResponse({ description: 'Usuario actualizado correctamente.' })
  @ApiBadRequestResponse({
    description: 'Los datos enviados no cumplen las validaciones.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: HttpErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un usuario (solo admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Id del usuario.' })
  @ApiNoContentResponse({ description: 'Usuario eliminado correctamente.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: HttpErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
