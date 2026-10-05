import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';
import {
  ComponentType,
  HARDWARE_SPEC_FIELDS,
  type HardwareSpecValueType,
} from '../product-component.types';

@ValidatorConstraint({ name: 'hardwareSpecsMatchComponentType', async: false })
export class HardwareSpecsMatchesComponentTypeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const componentType = (args.object as { componentType?: ComponentType })
      .componentType;

    if (
      componentType !== undefined &&
      !Object.values(ComponentType).includes(componentType)
    ) {
      return false;
    }

    const allowedFields = componentType
      ? HARDWARE_SPEC_FIELDS[componentType]
      : Object.values(HARDWARE_SPEC_FIELDS).reduce(
          (fields, componentFields) => ({ ...fields, ...componentFields }),
          {} as Record<string, HardwareSpecValueType>,
        );

    return Object.entries(value as Record<string, unknown>).every(
      ([field, fieldValue]) =>
        field in allowedFields &&
        this.matchesType(fieldValue, allowedFields[field]),
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const componentType = (args.object as { componentType?: ComponentType })
      .componentType;

    return componentType
      ? `hardwareSpecs contiene propiedades inválidas para el componente "${componentType}".`
      : 'hardwareSpecs contiene propiedades o valores inválidos.';
  }

  private matchesType(
    value: unknown,
    expectedType: HardwareSpecValueType,
  ): boolean {
    if (expectedType === 'number') {
      return typeof value === 'number' && Number.isFinite(value) && value >= 0;
    }

    if (expectedType === 'string') {
      return typeof value === 'string' && value.trim().length > 0;
    }

    return (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  }
}
