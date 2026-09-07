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
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

// Payload que dejará JwtStrategy (NE-33) en req.user una vez validado el token.
interface AuthenticatedRequest extends Request {
  user?: { sub: number };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // NOTA: hasta que se implementen NE-33 (JwtStrategy), NE-34 (JwtAuthGuard) y
  // NE-35 (@CurrentUser), req.user todavía no se completa automáticamente.
  // NE-37 va a agregar @UseGuards(JwtAuthGuard) acá y reemplazar @Req() por
  // @CurrentUser() en /me. Las rutas de admin también se protegen en NE-37
  // con RolesGuard.
  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest): Promise<User> {
    return this.usersService.findOne(req.user!.sub);
  }

  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(req.user!.sub, dto);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
