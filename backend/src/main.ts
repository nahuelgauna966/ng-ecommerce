import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // rawBody: true habilita request.rawBody, necesario para verificar la
  // firma del webhook de Stripe (POST /payments/webhook).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Activa la validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades extra
      transform: true,       // convierte automáticamente los tipos
    }),
  );

  // Formato uniforme de errores HTTP: { statusCode, message, timestamp, path }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Prefijo global para todas las rutas: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Documentación Swagger disponible en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ng-ecommerce API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend corriendo en: http://localhost:${port}/api/v1`);
}
bootstrap();
