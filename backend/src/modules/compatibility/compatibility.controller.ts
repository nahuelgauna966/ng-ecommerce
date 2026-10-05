import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { CompatibilityResultDto } from './dto/compatibility-result.dto';
import { ValidateCompatibilityDto } from './dto/validate-compatibility.dto';
import { CompatibilityService } from './compatibility.service';

@ApiTags('compatibility')
@Controller('compatibility')
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar la compatibilidad de una selección de componentes de PC.',
    description:
      'Endpoint público. Los componentes CPU, motherboard, RAM, GPU y PSU son requeridos; gabinete y cooler son opcionales. El margen mínimo de la fuente es 100 W.',
  })
  @ApiOkResponse({
    description:
      'Resultado compatible, incompatible o incompleto con una explicación por comprobación.',
    type: CompatibilityResultDto,
  })
  @ApiBadRequestResponse({
    description:
      'La lista contiene IDs inválidos/duplicados, productos sin tipo o más de un producto por componente.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Uno o más productos no existen o están inactivos.',
    type: HttpErrorResponseDto,
  })
  validate(
    @Body() dto: ValidateCompatibilityDto,
  ): Promise<CompatibilityResultDto> {
    return this.compatibilityService.validate(dto);
  }
}
