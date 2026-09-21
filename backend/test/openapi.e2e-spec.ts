import { E2E_BASE_URL } from './e2e-server.config';

type Schema = {
  format?: string;
  properties?: Record<string, Schema>;
  required?: string[];
};

type Operation = {
  parameters?: Array<{ name: string }>;
  requestBody?: {
    content?: Record<string, { schema?: Schema }>;
  };
  responses: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
};

type OpenApiDocument = {
  components?: {
    schemas?: Record<string, Schema>;
  };
  paths: Record<string, Record<string, Operation>>;
};

async function getOpenApiDocument(): Promise<OpenApiDocument> {
  const res = await fetch(
    `${E2E_BASE_URL.replace('/api/v1', '')}/api/docs-json`,
  );

  expect(res.status).toBe(200);
  return (await res.json()) as OpenApiDocument;
}

function getOperation(
  document: OpenApiDocument,
  path: string,
  method: string,
): Operation {
  const operation = document.paths[path]?.[method];

  if (!operation) {
    throw new Error(
      `No se encontró ${method.toUpperCase()} ${path} en OpenAPI`,
    );
  }

  return operation;
}

describe('OpenAPI contract (e2e)', () => {
  let document: OpenApiDocument;

  beforeAll(async () => {
    document = await getOpenApiDocument();
  });

  it('documenta los cuerpos de login y registro', () => {
    const schemas = document.components?.schemas;

    expect(schemas?.LoginDto?.properties?.email).toBeDefined();
    expect(schemas?.LoginDto?.properties?.password).toBeDefined();
    expect(schemas?.RegisterDto?.properties?.name).toBeDefined();
    expect(schemas?.RegisterDto?.properties?.email).toBeDefined();
    expect(schemas?.RegisterDto?.properties?.password).toBeDefined();
  });

  it('documenta respuestas de error con el formato global de la API', () => {
    const errorSchema = document.components?.schemas?.HttpErrorResponseDto;

    expect(errorSchema?.properties?.statusCode).toBeDefined();
    expect(errorSchema?.properties?.message).toBeDefined();
    expect(errorSchema?.properties?.timestamp).toBeDefined();
    expect(errorSchema?.properties?.path).toBeDefined();

    expect(
      getOperation(document, '/api/v1/auth/login', 'post').responses,
    ).toHaveProperty('401');
    expect(
      getOperation(document, '/api/v1/categories', 'post').responses,
    ).toHaveProperty('403');
    expect(
      getOperation(document, '/api/v1/orders/{id}', 'get').responses,
    ).toHaveProperty('404');
  });

  it('documenta los filtros administrativos y la seguridad Bearer', () => {
    const orders = getOperation(document, '/api/v1/orders', 'get');
    const users = getOperation(document, '/api/v1/users', 'get');

    expect(orders.responses).toHaveProperty('200');
    expect(users.responses).toHaveProperty('200');
    expect(orders.parameters?.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'page',
        'limit',
        'status',
        'from',
        'to',
        'search',
      ]),
    );
    expect(users.parameters?.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['page', 'limit', 'role', 'search']),
    );
    expect(orders.security?.length).toBeGreaterThan(0);
    expect(users.security?.length).toBeGreaterThan(0);
  });

  it('documenta la carga multipart de imagen de producto', () => {
    const upload = getOperation(
      document,
      '/api/v1/products/{id}/image',
      'post',
    );
    const schema = upload.requestBody?.content?.['multipart/form-data']?.schema;

    expect(schema?.required).toContain('image');
    expect(schema?.properties?.image?.format).toBe('binary');
    expect(upload.responses).toHaveProperty('200');
    expect(upload.responses).toHaveProperty('400');
    expect(upload.responses).toHaveProperty('401');
    expect(upload.responses).toHaveProperty('403');
    expect(upload.responses).toHaveProperty('404');
  });
});
