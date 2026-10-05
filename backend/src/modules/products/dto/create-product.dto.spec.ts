import { validateSync } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { ComponentType } from '../product-component.types';

function createProductDto(
  values: Partial<CreateProductDto> = {},
): CreateProductDto {
  return Object.assign(new CreateProductDto(), {
    name: 'Procesador de prueba',
    price: 100,
    ...values,
  });
}

describe('CreateProductDto hardware metadata', () => {
  it('keeps hardware and merchandising metadata optional for existing products', () => {
    expect(validateSync(createProductDto())).toHaveLength(0);
  });

  it('accepts specifications valid for the selected component type', () => {
    const dto = createProductDto({
      brand: ' AMD ',
      componentType: ComponentType.CPU,
      hardwareSpecs: { socket: 'AM5', powerDrawWatts: 105 },
      isFeatured: true,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects fields that belong to a different component type', () => {
    const dto = createProductDto({
      componentType: ComponentType.CPU,
      hardwareSpecs: { powerConnectors: ['8-pin'] },
    });

    expect(
      validateSync(dto).some((error) => error.property === 'hardwareSpecs'),
    ).toBe(true);
  });

  it('rejects unknown component types and unsupported specification fields', () => {
    const invalidType = createProductDto({
      componentType: 'processor' as ComponentType,
    });
    const invalidSpecs = createProductDto({
      componentType: ComponentType.GPU,
      hardwareSpecs: {
        unknownField: true,
      } as CreateProductDto['hardwareSpecs'],
    });

    expect(
      validateSync(invalidType).some(
        (error) => error.property === 'componentType',
      ),
    ).toBe(true);
    expect(
      validateSync(invalidSpecs).some(
        (error) => error.property === 'hardwareSpecs',
      ),
    ).toBe(true);
  });
});
