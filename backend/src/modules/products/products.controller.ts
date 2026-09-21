import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
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
import { UserRole } from '../users/user.entity';
import { ProductsService, PaginatedResult } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Product } from './product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de productos.' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.findAllPaginated(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 1, description: 'Id del producto.' })
  @ApiOkResponse({ description: 'Producto encontrado.' })
  @ApiNotFoundResponse({
    description: 'El producto no existe.',
    type: HttpErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiCreatedResponse({ description: 'Producto creado correctamente.' })
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
    description: 'La categoría indicada no existe.',
    type: HttpErrorResponseDto,
  })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  @ApiParam({ name: 'id', example: 1, description: 'Id del producto.' })
  @ApiOkResponse({ description: 'Producto actualizado correctamente.' })
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
    description: 'El producto o la categoría indicada no existe.',
    type: HttpErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', example: 1, description: 'Id del producto.' })
  @ApiNoContentResponse({ description: 'Producto eliminado correctamente.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El producto no existe.',
    type: HttpErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/image')
  @ApiOperation({
    summary: 'Subir o reemplazar la imagen de un producto (solo admin)',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Id del producto.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen JPEG, PNG o WebP de hasta 5 MiB.',
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen JPEG, PNG o WebP. Tamaño máximo: 5 MiB.',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Imagen del producto actualizada correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'No se envió una imagen válida, el formato no está permitido o supera 5 MiB.',
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
    description: 'El producto no existe.',
    type: HttpErrorResponseDto,
  })
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    image: Express.Multer.File,
  ): Promise<Product> {
    return this.productsService.updateImage(id, image);
  }
}
