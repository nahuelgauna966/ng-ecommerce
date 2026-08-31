import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activa la validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades extra
      transform: true,       // convierte automáticamente los tipos
    }),
  );

  // Prefijo global para todas las rutas: /api/v1/...
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend corriendo en: http://localhost:${port}/api/v1`);
}
bootstrap();
