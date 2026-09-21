import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Código de estado HTTP.' })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'El correo electrónico ya está registrado.',
    description: 'Mensaje de error o lista de mensajes de validación.',
  })
  message: string | string[];

  @ApiProperty({
    example: '2026-09-21T12:00:00.000Z',
    format: 'date-time',
    description: 'Momento en el que se produjo el error.',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/categories/1',
    description: 'Ruta que recibió la solicitud.',
  })
  path: string;
}
