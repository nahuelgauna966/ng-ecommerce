import { validateSync } from 'class-validator';
import { ValidateCompatibilityDto } from './validate-compatibility.dto';

describe('ValidateCompatibilityDto', () => {
  it('accepts an empty selection and unique positive IDs', () => {
    expect(
      validateSync(
        Object.assign(new ValidateCompatibilityDto(), { productIds: [] }),
      ),
    ).toHaveLength(0);
    expect(
      validateSync(
        Object.assign(new ValidateCompatibilityDto(), {
          productIds: [1, 2, 3],
        }),
      ),
    ).toHaveLength(0);
  });

  it('rejects duplicate, non-positive, non-integer and oversized ID lists', () => {
    const invalidSelections = [
      [1, 1],
      [0],
      [1.5],
      Array.from({ length: 11 }, (_, index) => index + 1),
    ];

    for (const productIds of invalidSelections) {
      expect(
        validateSync(
          Object.assign(new ValidateCompatibilityDto(), { productIds }),
        ),
      ).not.toHaveLength(0);
    }
  });
});
