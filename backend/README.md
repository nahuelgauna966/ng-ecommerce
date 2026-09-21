# ng-ecommerce — Backend

Backend del e-commerce de computadoras gamer, componentes y periféricos.

## Stack
- NestJS + TypeScript
- PostgreSQL (Neon)
- TypeORM

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run start:dev
```

Para permitir solicitudes desde el panel de administración local, configurá
`CORS_ORIGIN=http://localhost:3001` en el archivo `.env`. Para producción se
pueden indicar varios orígenes separados por coma, por ejemplo
`CORS_ORIGIN=https://admin.ejemplo.com,https://backoffice.ejemplo.com`.

## Build producción

```bash
npm run build
npm run start:prod
```
