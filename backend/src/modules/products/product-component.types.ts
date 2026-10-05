export enum ComponentType {
  CPU = 'cpu',
  GPU = 'gpu',
  MOTHERBOARD = 'motherboard',
  RAM = 'ram',
  PSU = 'psu',
  STORAGE = 'storage',
  CASE = 'case',
  COOLER = 'cooler',
  PERIPHERAL = 'peripheral',
  OTHER = 'other',
}

export interface CpuHardwareSpecs {
  socket?: string;
  powerDrawWatts?: number;
  supportedCpuModels?: string[];
}

export interface GpuHardwareSpecs {
  powerDrawWatts?: number;
  lengthMm?: number;
  powerConnectors?: string[];
}

export interface MotherboardHardwareSpecs {
  socket?: string;
  memoryType?: string;
  maxMemoryGb?: number;
  formFactor?: string;
  supportedCpuModels?: string[];
}

export interface RamHardwareSpecs {
  memoryType?: string;
  capacityGb?: number;
  speedMhz?: number;
  moduleCount?: number;
}

export interface PsuHardwareSpecs {
  wattage?: number;
  connectors?: string[];
}

export interface StorageHardwareSpecs {
  interface?: string;
  capacityGb?: number;
}

export interface CaseHardwareSpecs {
  supportedFormFactors?: string[];
  maxGpuLengthMm?: number;
}

export interface CoolerHardwareSpecs {
  sockets?: string[];
  maxTdpWatts?: number;
  heightMm?: number;
}

export type HardwareSpecs =
  | CpuHardwareSpecs
  | GpuHardwareSpecs
  | MotherboardHardwareSpecs
  | RamHardwareSpecs
  | PsuHardwareSpecs
  | StorageHardwareSpecs
  | CaseHardwareSpecs
  | CoolerHardwareSpecs
  | Record<string, never>;

export type HardwareSpecValueType = 'string' | 'number' | 'string[]';

export const HARDWARE_SPEC_FIELDS: Record<
  ComponentType,
  Record<string, HardwareSpecValueType>
> = {
  [ComponentType.CPU]: {
    socket: 'string',
    powerDrawWatts: 'number',
    supportedCpuModels: 'string[]',
  },
  [ComponentType.GPU]: {
    powerDrawWatts: 'number',
    lengthMm: 'number',
    powerConnectors: 'string[]',
  },
  [ComponentType.MOTHERBOARD]: {
    socket: 'string',
    memoryType: 'string',
    maxMemoryGb: 'number',
    formFactor: 'string',
    supportedCpuModels: 'string[]',
  },
  [ComponentType.RAM]: {
    memoryType: 'string',
    capacityGb: 'number',
    speedMhz: 'number',
    moduleCount: 'number',
  },
  [ComponentType.PSU]: {
    wattage: 'number',
    connectors: 'string[]',
  },
  [ComponentType.STORAGE]: {
    interface: 'string',
    capacityGb: 'number',
  },
  [ComponentType.CASE]: {
    supportedFormFactors: 'string[]',
    maxGpuLengthMm: 'number',
  },
  [ComponentType.COOLER]: {
    sockets: 'string[]',
    maxTdpWatts: 'number',
    heightMm: 'number',
  },
  [ComponentType.PERIPHERAL]: {},
  [ComponentType.OTHER]: {},
};
