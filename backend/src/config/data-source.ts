import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * DataSource usado exclusivamente por la CLI de TypeORM (migration:generate,
 * migration:run, migration:revert). La configuración de runtime de la app
 * vive en src/config/database.config.ts.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
