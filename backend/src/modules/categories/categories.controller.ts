import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista de categorías.' })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 1, description: 'Id de la categoría.' })
  @ApiOkResponse({ description: 'Categoría encontrada.' })
  @ApiNotFoundResponse({
    description: 'La categoría no existe.',
    type: HttpErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiCreatedResponse({ description: 'Categoría creada correctamente.' })
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
  @ApiConflictResponse({
    description: 'La categoría ya existe.',
    type: HttpErrorResponseDto,
  })
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  @ApiParam({ name: 'id', example: 1, description: 'Id de la categoría.' })
  @ApiOkResponse({ description: 'Categoría actualizada correctamente.' })
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
    description: 'La categoría no existe.',
    type: HttpErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'La categoría ya existe.',
    type: HttpErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', example: 1, description: 'Id de la categoría.' })
  @ApiNoContentResponse({ description: 'Categoría eliminada correctamente.' })
  @ApiBadRequestResponse({
    description: 'La categoría tiene productos asociados.',
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
    description: 'La categoría no existe.',
    type: HttpErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
