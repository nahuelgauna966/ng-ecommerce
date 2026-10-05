import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ComponentType } from '../products/product-component.types';
import { Product } from '../products/product.entity';
import { ValidateCompatibilityDto } from './dto/validate-compatibility.dto';
import { CompatibilityCheck, CompatibilityResult } from './compatibility.types';

type ProductByType = Partial<Record<ComponentType, Product>>;
type Specs = Record<string, unknown>;

const REQUIRED_COMPONENTS: ComponentType[] = [
  ComponentType.CPU,
  ComponentType.MOTHERBOARD,
  ComponentType.RAM,
  ComponentType.GPU,
  ComponentType.PSU,
];

const PSU_HEADROOM_WATTS = 100;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function specsOf(product: Product | undefined): Specs | undefined {
  const value: unknown = product?.hardwareSpecs;
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Specs)
    : undefined;
}

function stringSpec(
  product: Product | undefined,
  key: string,
): string | undefined {
  const value = specsOf(product)?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberSpec(
  product: Product | undefined,
  key: string,
): number | undefined {
  const value = specsOf(product)?.[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function stringArraySpec(
  product: Product | undefined,
  key: string,
): string[] | undefined {
  const value = specsOf(product)?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value.map((item) => item.trim()).filter(Boolean)
    : undefined;
}

@Injectable()
export class CompatibilityService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async validate(dto: ValidateCompatibilityDto): Promise<CompatibilityResult> {
    const productIds = dto.productIds ?? [];
    const products = productIds.length
      ? await this.productsRepository.find({
          where: { id: In(productIds), isActive: true },
        })
      : [];

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Uno o más productos no existen o están inactivos.',
      );
    }

    const byType: ProductByType = {};
    for (const product of products) {
      if (!product.componentType) {
        throw new BadRequestException(
          `El producto ${product.id} no tiene un tipo de componente definido.`,
        );
      }
      if (!Object.values(ComponentType).includes(product.componentType)) {
        throw new BadRequestException(
          `El producto ${product.id} tiene un tipo de componente inválido.`,
        );
      }
      if (byType[product.componentType]) {
        throw new BadRequestException(
          `Solo se permite un producto por tipo de componente (${product.componentType}).`,
        );
      }
      byType[product.componentType] = product;
    }

    const checks: CompatibilityCheck[] = [];
    for (const componentType of REQUIRED_COMPONENTS) {
      if (!byType[componentType]) {
        checks.push({
          rule: `required_${componentType}`,
          status: 'incomplete',
          productIds: [],
          message: `Falta seleccionar un componente obligatorio: ${componentType}.`,
        });
      }
    }

    this.checkCpuMotherboard(byType, checks);
    this.checkRamMotherboard(byType, checks);
    this.checkPsuPower(byType, checks);
    this.checkCaseFormFactor(byType, checks);
    this.checkCoolerSocket(byType, checks);

    const status = checks.some((check) => check.status === 'incompatible')
      ? 'incompatible'
      : checks.some((check) => check.status === 'incomplete')
        ? 'incomplete'
        : 'compatible';

    return {
      status,
      products: products.map(({ id, name, componentType }) => ({
        id,
        name,
        componentType,
      })),
      checks,
    };
  }

  private checkCpuMotherboard(
    byType: ProductByType,
    checks: CompatibilityCheck[],
  ): void {
    const cpu = byType[ComponentType.CPU];
    const motherboard = byType[ComponentType.MOTHERBOARD];
    if (!cpu || !motherboard) return;

    const cpuSocket = stringSpec(cpu, 'socket');
    const boardSocket = stringSpec(motherboard, 'socket');
    if (!cpuSocket || !boardSocket) {
      checks.push(
        this.incompleteCheck(
          'cpu_motherboard_socket',
          [cpu.id, motherboard.id],
          'No se puede verificar el socket: faltan especificaciones de CPU o motherboard.',
        ),
      );
      return;
    }

    const compatible = normalized(cpuSocket) === normalized(boardSocket);
    checks.push({
      rule: 'cpu_motherboard_socket',
      status: compatible ? 'compatible' : 'incompatible',
      productIds: [cpu.id, motherboard.id],
      message: compatible
        ? `Los sockets ${cpuSocket} y ${boardSocket} son compatibles.`
        : `El socket ${cpuSocket} del CPU no coincide con el socket ${boardSocket} de la motherboard.`,
    });
  }

  private checkRamMotherboard(
    byType: ProductByType,
    checks: CompatibilityCheck[],
  ): void {
    const ram = byType[ComponentType.RAM];
    const motherboard = byType[ComponentType.MOTHERBOARD];
    if (!ram || !motherboard) return;

    const ramType = stringSpec(ram, 'memoryType');
    const boardType = stringSpec(motherboard, 'memoryType');
    const capacity = numberSpec(ram, 'capacityGb');
    const maxCapacity = numberSpec(motherboard, 'maxMemoryGb');
    const ids = [ram.id, motherboard.id];

    if (
      !ramType ||
      !boardType ||
      capacity === undefined ||
      maxCapacity === undefined
    ) {
      checks.push(
        this.incompleteCheck(
          'ram_motherboard_memory',
          ids,
          'No se puede verificar memoria: faltan el tipo o la capacidad de RAM, o el tipo o máximo admitido por la motherboard.',
        ),
      );
      return;
    }

    const typeMatches = normalized(ramType) === normalized(boardType);
    const capacityFits = capacity <= maxCapacity;
    checks.push({
      rule: 'ram_motherboard_memory',
      status: typeMatches && capacityFits ? 'compatible' : 'incompatible',
      productIds: ids,
      message: !typeMatches
        ? `La motherboard admite ${boardType}, pero la RAM seleccionada es ${ramType}.`
        : !capacityFits
          ? `La RAM seleccionada (${capacity} GB) supera el máximo de la motherboard (${maxCapacity} GB).`
          : `El tipo ${ramType} y la capacidad de ${capacity} GB son compatibles con la motherboard.`,
    });
  }

  private checkPsuPower(
    byType: ProductByType,
    checks: CompatibilityCheck[],
  ): void {
    const cpu = byType[ComponentType.CPU];
    const gpu = byType[ComponentType.GPU];
    const psu = byType[ComponentType.PSU];
    if (!cpu || !gpu || !psu) return;

    const cpuDraw = numberSpec(cpu, 'powerDrawWatts');
    const gpuDraw = numberSpec(gpu, 'powerDrawWatts');
    const wattage = numberSpec(psu, 'wattage');
    const ids = [cpu.id, gpu.id, psu.id];

    if (
      cpuDraw === undefined ||
      gpuDraw === undefined ||
      wattage === undefined
    ) {
      checks.push(
        this.incompleteCheck(
          'psu_power_budget',
          ids,
          'No se puede verificar la fuente: faltan consumos estimados del CPU/GPU o la potencia de la PSU.',
        ),
      );
      return;
    }

    const requiredWattage = cpuDraw + gpuDraw + PSU_HEADROOM_WATTS;
    const compatible = wattage >= requiredWattage;
    checks.push({
      rule: 'psu_power_budget',
      status: compatible ? 'compatible' : 'incompatible',
      productIds: ids,
      message: compatible
        ? `La PSU de ${wattage} W cubre los ${cpuDraw + gpuDraw} W estimados y ${PSU_HEADROOM_WATTS} W de margen.`
        : `La PSU de ${wattage} W no alcanza: se requieren al menos ${requiredWattage} W (${cpuDraw + gpuDraw} W estimados más ${PSU_HEADROOM_WATTS} W de margen).`,
    });
  }

  private checkCaseFormFactor(
    byType: ProductByType,
    checks: CompatibilityCheck[],
  ): void {
    const pcCase = byType[ComponentType.CASE];
    if (!pcCase) return;
    const motherboard = byType[ComponentType.MOTHERBOARD];
    if (!motherboard) {
      checks.push(
        this.incompleteCheck(
          'motherboard_case_form_factor',
          [pcCase.id],
          'No se puede verificar el gabinete sin una motherboard seleccionada.',
        ),
      );
      return;
    }

    const formFactor = stringSpec(motherboard, 'formFactor');
    const supported = stringArraySpec(pcCase, 'supportedFormFactors');
    if (!formFactor || !supported?.length) {
      checks.push(
        this.incompleteCheck(
          'motherboard_case_form_factor',
          [motherboard.id, pcCase.id],
          'No se puede verificar el formato: falta el formato de motherboard o los formatos admitidos por el gabinete.',
        ),
      );
      return;
    }

    const compatible = supported.some(
      (value) => normalized(value) === normalized(formFactor),
    );
    checks.push({
      rule: 'motherboard_case_form_factor',
      status: compatible ? 'compatible' : 'incompatible',
      productIds: [motherboard.id, pcCase.id],
      message: compatible
        ? `El gabinete admite el formato ${formFactor}.`
        : `El gabinete no admite el formato ${formFactor} de la motherboard.`,
    });
  }

  private checkCoolerSocket(
    byType: ProductByType,
    checks: CompatibilityCheck[],
  ): void {
    const cooler = byType[ComponentType.COOLER];
    if (!cooler) return;
    const cpu = byType[ComponentType.CPU];
    if (!cpu) {
      checks.push(
        this.incompleteCheck(
          'cpu_cooler_socket',
          [cooler.id],
          'No se puede verificar el cooler sin un CPU seleccionado.',
        ),
      );
      return;
    }

    const cpuSocket = stringSpec(cpu, 'socket');
    const supportedSockets = stringArraySpec(cooler, 'sockets');
    if (!cpuSocket || !supportedSockets?.length) {
      checks.push(
        this.incompleteCheck(
          'cpu_cooler_socket',
          [cpu.id, cooler.id],
          'No se puede verificar el socket: falta el socket de CPU o los sockets admitidos por el cooler.',
        ),
      );
      return;
    }

    const compatible = supportedSockets.some(
      (socket) => normalized(socket) === normalized(cpuSocket),
    );
    checks.push({
      rule: 'cpu_cooler_socket',
      status: compatible ? 'compatible' : 'incompatible',
      productIds: [cpu.id, cooler.id],
      message: compatible
        ? `El cooler admite el socket ${cpuSocket}.`
        : `El cooler no admite el socket ${cpuSocket} del CPU.`,
    });
  }

  private incompleteCheck(
    rule: string,
    productIds: number[],
    message: string,
  ): CompatibilityCheck {
    return {
      rule,
      status: 'incomplete',
      productIds,
      message,
    };
  }
}
