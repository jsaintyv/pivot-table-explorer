/**
 * Aggregation Functions Tests
 * 
 * Tests for all aggregation functions in the aggregations utility module.
 */

import {
  sumAggregation,
  avgAggregation,
  countAggregation,
  minAggregation,
  maxAggregation,
  aggregationFunctions,
  getAggregationFunction,
  getAggregationFunctionNames,
  isValidAggregationFunction,
} from './aggregations';

// ============================================================================
// Test Data
// ============================================================================

const numericValues = [10, 20, 30, 40, 50];
const mixedValues = [10, '20', 30, null, undefined, true, false];
const emptyValues: (string | number | boolean | null | undefined)[] = [];
const allNonNumeric = ['a', 'b', null, undefined, true, false];
const withZero = [0, 10, 20, 0, 30];
const negativeValues = [-10, -5, 0, 5, 10];
const decimalValues = [1.5, 2.5, 3.5, 4.5];

// ============================================================================
// sumAggregation Tests
// ============================================================================

describe('sumAggregation', () => {
  it('should sum numeric values correctly', () => {
    expect(sumAggregation(numericValues)).toBe(150);
  });

  it('should handle mixed values (numbers and strings)', () => {
    // '20' as string should be converted to number
    // Values: 10, '20' (20), 30, null (0), undefined (0), true (1), false (0)
    // Sum: 10 + 20 + 30 + 0 + 0 + 1 + 0 = 61
    expect(sumAggregation(mixedValues)).toBe(61);
  });

  it('should return 0 for empty array', () => {
    expect(sumAggregation(emptyValues)).toBe(0);
  });

  it('should return 1 for all non-numeric values (true=1, null=0, false=0)', () => {
    // allNonNumeric = ['a', 'b', null, undefined, true, false]
    // Number conversion with || 0:
    // 'a' → NaN || 0 = 0, 'b' → NaN || 0 = 0
    // null → 0, undefined → 0
    // true → 1, false → 0
    // Valid numbers: [0, 0, 0, 0, 1, 0]
    // Sum: 0 + 0 + 0 + 0 + 1 + 0 = 1
    expect(sumAggregation(allNonNumeric)).toBe(1);
  });

  it('should handle zero values correctly', () => {
    expect(sumAggregation(withZero)).toBe(60);
  });

  it('should handle negative values correctly', () => {
    expect(sumAggregation(negativeValues)).toBe(0);
  });

  it('should handle decimal values correctly', () => {
    expect(sumAggregation(decimalValues)).toBe(12);
  });
});

// ============================================================================
// avgAggregation Tests
// ============================================================================

describe('avgAggregation', () => {
  it('should calculate average of numeric values', () => {
    expect(avgAggregation(numericValues)).toBe(30); // (10+20+30+40+50)/5 = 30
  });

  it('should handle mixed values', () => {
    expect(avgAggregation(mixedValues)).toBeCloseTo(10.1666666667); // 61/6 ≈ 10.1667
  });

  it('should return 0 for empty array', () => {
    expect(avgAggregation(emptyValues)).toBe(0);
  });

  it('should return average for all non-numeric values', () => {
    // allNonNumeric = ['a', 'b', null, undefined, true, false]
    // Number conversion:
    // 'a' → NaN (filtered), 'b' → NaN (filtered)
    // null → 0, undefined → NaN (filtered)
    // true → 1, false → 0
    // Valid numbers: [0, 1, 0]
    // Average: (0 + 1 + 0) / 3 ≈ 0.333333
    expect(avgAggregation(allNonNumeric)).toBeCloseTo(0.3333333333);
  });

  it('should handle single value', () => {
    expect(avgAggregation([42])).toBe(42);
  });

  it('should handle negative values', () => {
    expect(avgAggregation(negativeValues)).toBe(0);
  });
});

// ============================================================================
// countAggregation Tests
// ============================================================================

describe('countAggregation', () => {
  it('should count all values including non-numeric', () => {
    expect(countAggregation(numericValues)).toBe(5);
    expect(countAggregation(mixedValues)).toBe(7);
  });

  it('should return 0 for empty array', () => {
    expect(countAggregation(emptyValues)).toBe(0);
  });

  it('should count null and undefined', () => {
    expect(countAggregation([null, undefined, null])).toBe(3);
  });
});

// ============================================================================
// minAggregation Tests
// ============================================================================

describe('minAggregation', () => {
  it('should find minimum numeric value', () => {
    expect(minAggregation(numericValues)).toBe(10);
  });

  it('should handle mixed values', () => {
    // mixedValues = [10, '20', 30, null, undefined, true, false]
    // Valid numbers: 10, 20, 30, 1 (true), 0 (false)
    // Min: 0
    expect(minAggregation(mixedValues)).toBe(0);
  });

  it('should return 0 for empty array', () => {
    expect(minAggregation(emptyValues)).toBe(0);
  });

  it('should return 0 for all non-numeric values', () => {
    expect(minAggregation(allNonNumeric)).toBe(0);
  });

  it('should handle negative values', () => {
    expect(minAggregation(negativeValues)).toBe(-10);
  });

  it('should handle single value', () => {
    expect(minAggregation([42])).toBe(42);
  });
});

// ============================================================================
// maxAggregation Tests
// ============================================================================

describe('maxAggregation', () => {
  it('should find maximum numeric value', () => {
    expect(maxAggregation(numericValues)).toBe(50);
  });

  it('should handle mixed values', () => {
    // mixedValues = [10, '20', 30, null, undefined, true, false]
    // Valid numbers: 10, 20, 30, 1 (true), 0 (false)
    // Max: 30
    expect(maxAggregation(mixedValues)).toBe(30);
  });

  it('should return 0 for empty array', () => {
    expect(maxAggregation(emptyValues)).toBe(0);
  });

  it('should return 1 for all non-numeric values (true=1)', () => {
    // allNonNumeric = ['a', 'b', null, undefined, true, false]
    // Valid numbers: true=1, false=0
    // Max: 1
    expect(maxAggregation(allNonNumeric)).toBe(1);
  });

  it('should handle negative values', () => {
    expect(maxAggregation(negativeValues)).toBe(10);
  });

  it('should handle single value', () => {
    expect(maxAggregation([42])).toBe(42);
  });
});

// ============================================================================
// aggregationFunctions Registry Tests
// ============================================================================

describe('aggregationFunctions', () => {
  it('should have all required aggregation functions', () => {
    expect(aggregationFunctions).toHaveProperty('sum');
    expect(aggregationFunctions).toHaveProperty('avg');
    expect(aggregationFunctions).toHaveProperty('count');
    expect(aggregationFunctions).toHaveProperty('min');
    expect(aggregationFunctions).toHaveProperty('max');
  });

  it('should have 5 aggregation functions', () => {
    expect(Object.keys(aggregationFunctions)).toHaveLength(5);
  });

  it('should map to correct implementations', () => {
    expect(aggregationFunctions.sum).toBe(sumAggregation);
    expect(aggregationFunctions.avg).toBe(avgAggregation);
    expect(aggregationFunctions.count).toBe(countAggregation);
    expect(aggregationFunctions.min).toBe(minAggregation);
    expect(aggregationFunctions.max).toBe(maxAggregation);
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('getAggregationFunction', () => {
  it('should return sum function for "sum"', () => {
    const sumFn = getAggregationFunction('sum');
    expect(sumFn(numericValues)).toBe(150);
  });

  it('should return avg function for "avg"', () => {
    const avgFn = getAggregationFunction('avg');
    expect(avgFn(numericValues)).toBe(30);
  });

  it('should throw error for invalid aggregation name', () => {
    expect(() => getAggregationFunction('invalid' as any)).toThrow(
      "Aggregation function 'invalid' not found"
    );
  });
});

describe('getAggregationFunctionNames', () => {
  it('should return array of all aggregation function names', () => {
    const names = getAggregationFunctionNames();
    expect(names).toEqual(['sum', 'avg', 'count', 'min', 'max']);
  });

  it('should return 5 names', () => {
    expect(getAggregationFunctionNames()).toHaveLength(5);
  });
});

describe('isValidAggregationFunction', () => {
  it('should return true for valid function names', () => {
    expect(isValidAggregationFunction('sum')).toBe(true);
    expect(isValidAggregationFunction('avg')).toBe(true);
    expect(isValidAggregationFunction('count')).toBe(true);
    expect(isValidAggregationFunction('min')).toBe(true);
    expect(isValidAggregationFunction('max')).toBe(true);
  });

  it('should return false for invalid function names', () => {
    expect(isValidAggregationFunction('invalid')).toBe(false);
    expect(isValidAggregationFunction('total')).toBe(false);
    expect(isValidAggregationFunction('')).toBe(false);
  });

  it('should work as type guard', () => {
    const name: string = 'sum';
    if (isValidAggregationFunction(name)) {
      // name is now typed as AggregationFunction
      const func = getAggregationFunction(name);
      expect(func(numericValues)).toBe(150);
    }
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Edge Cases', () => {
  it('should handle array with only null and undefined', () => {
    expect(sumAggregation([null, undefined, null])).toBe(0);
    expect(avgAggregation([null, undefined, null])).toBe(0);
    expect(countAggregation([null, undefined, null])).toBe(3);
  });

  it('should handle boolean values (true = 1, false = 0)', () => {
    expect(sumAggregation([true, false, true])).toBe(2);
    expect(avgAggregation([true, false, true])).toBeCloseTo(0.6666666667);
  });

  it('should handle string numbers', () => {
    expect(sumAggregation(['1', '2', '3'])).toBe(6);
    expect(avgAggregation(['10', '20'])).toBe(15);
  });

  it('should handle NaN values', () => {
    expect(sumAggregation([10, NaN, 20])).toBe(30);
    expect(avgAggregation([10, NaN, 20])).toBe(15);
  });

  it('should handle Infinity values', () => {
    expect(sumAggregation([10, Infinity, 20])).toBe(Infinity);
    expect(minAggregation([10, -Infinity, 20])).toBe(-Infinity);
    expect(maxAggregation([10, Infinity, 20])).toBe(Infinity);
  });
});
