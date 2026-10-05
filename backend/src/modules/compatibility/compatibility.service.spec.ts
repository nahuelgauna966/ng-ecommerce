import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ComponentType } from '../products/product-component.types';
import { Product } from '../products/product.entity';
import { CompatibilityService } from './compatibility.service';

function component(
  id: number,
  componentType: ComponentType,
  hardwareSpecs: Record<string, unknown> | null,
): Product {
  return {
    id,
    name: `Product ${id}`,
    componentType,
    hardwareSpecs,
    isActive: true,
  } as Product;
}

describe('CompatibilityService', () => {
  let products: Product[];
  const repository = {
    find: jest.fn(() => Promise.resolve(products)),
  };
  const service = new CompatibilityService(
    repository as unknown as Repository<Product>,
  );

  beforeEach(() => {
    products = [];
    repository.find.mockImplementation(() => Promise.resolve(products));
  });

  async function validate(...selection: Product[]) {
    products = selection;
    return service.validate({ productIds: selection.map(({ id }) => id) });
  }

  const cpu = (id = 1, socket = 'AM5', powerDrawWatts = 100) =>
    component(id, ComponentType.CPU, { socket, powerDrawWatts });
  const motherboard = (
    id = 2,
    socket = 'am5',
    memoryType = 'DDR5',
    maxMemoryGb = 128,
    formFactor = 'ATX',
  ) =>
    component(id, ComponentType.MOTHERBOARD, {
      socket,
      memoryType,
      maxMemoryGb,
      formFactor,
    });
  const ram = (id = 3, memoryType = 'ddr5', capacityGb = 64) =>
    component(id, ComponentType.RAM, { memoryType, capacityGb });
  const gpu = (id = 4, powerDrawWatts = 250) =>
    component(id, ComponentType.GPU, { powerDrawWatts });
  const psu = (id = 5, wattage = 500) =>
    component(id, ComponentType.PSU, { wattage });

  it('returns compatible only when all required components and rules pass', async () => {
    const result = await validate(cpu(), motherboard(), ram(), gpu(), psu());

    expect(result.status).toBe('compatible');
    expect(result.checks.map(({ status }) => status)).toEqual([
      'compatible',
      'compatible',
      'compatible',
    ]);
  });

  it('reports an incompatible CPU and motherboard socket', async () => {
    const result = await validate(
      cpu(1, 'AM4'),
      motherboard(2, 'AM5'),
      ram(),
      gpu(),
      psu(),
    );

    expect(result.status).toBe('incompatible');
    expect(
      result.checks.find(({ rule }) => rule === 'cpu_motherboard_socket'),
    ).toMatchObject({ status: 'incompatible' });
  });

  it('checks both RAM generation and supported capacity', async () => {
    const result = await validate(
      cpu(),
      motherboard(2, 'AM5', 'DDR5', 32),
      ram(3, 'DDR4', 64),
      gpu(),
      psu(),
    );

    const ramCheck = result.checks.find(
      ({ rule }) => rule === 'ram_motherboard_memory',
    );
    expect(ramCheck).toMatchObject({ status: 'incompatible' });
    expect(ramCheck?.message).toContain('DDR5');
  });

  it('requires CPU/GPU power specs and the configured 100 W PSU headroom', async () => {
    const belowHeadroom = await validate(
      cpu(1, 'AM5', 200),
      motherboard(),
      ram(),
      gpu(4, 300),
      psu(5, 599),
    );
    expect(
      belowHeadroom.checks.find(({ rule }) => rule === 'psu_power_budget'),
    ).toMatchObject({ status: 'incompatible' });

    const missingGpuPower = gpu(4, 0);
    missingGpuPower.hardwareSpecs = {};
    const missingSpecs = await validate(
      cpu(),
      motherboard(),
      ram(),
      missingGpuPower,
      psu(),
    );
    expect(
      missingSpecs.checks.find(({ rule }) => rule === 'psu_power_budget'),
    ).toMatchObject({ status: 'incomplete' });
  });

  it('checks optional case form factor and cooler socket', async () => {
    const pcCase = component(6, ComponentType.CASE, {
      supportedFormFactors: ['micro-atx'],
    });
    const cooler = component(7, ComponentType.COOLER, { sockets: ['AM4'] });
    const result = await validate(
      cpu(),
      motherboard(),
      ram(),
      gpu(),
      psu(),
      pcCase,
      cooler,
    );

    expect(result.status).toBe('incompatible');
    expect(
      result.checks.find(({ rule }) => rule === 'motherboard_case_form_factor'),
    ).toMatchObject({ status: 'incompatible' });
    expect(
      result.checks.find(({ rule }) => rule === 'cpu_cooler_socket'),
    ).toMatchObject({ status: 'incompatible' });
  });

  it('returns incomplete for missing required components and specs', async () => {
    const result = await validate(cpu());

    expect(result.status).toBe('incomplete');
    expect(result.checks.map(({ rule }) => rule)).toEqual(
      expect.arrayContaining([
        'required_motherboard',
        'required_ram',
        'required_gpu',
        'required_psu',
      ]),
    );
  });

  it('returns incomplete for an empty selection instead of claiming compatibility', async () => {
    const result = await service.validate({ productIds: [] });

    expect(result.status).toBe('incomplete');
    expect(result.products).toEqual([]);
    expect(result.checks).toHaveLength(5);
  });

  it('rejects inactive or unknown products and duplicate component types', async () => {
    repository.find.mockResolvedValueOnce([]);
    await expect(service.validate({ productIds: [99] })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(validate(cpu(), cpu(8))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects products without a component type', async () => {
    const untyped = { ...cpu(), componentType: null } as unknown as Product;
    await expect(validate(untyped)).rejects.toBeInstanceOf(BadRequestException);
  });
});
