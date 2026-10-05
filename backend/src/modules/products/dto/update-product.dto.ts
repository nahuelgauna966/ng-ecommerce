import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/** Los metadatos de hardware y merchandising también son opcionales al editar. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
