/**
 * Aggregation Functions Utility
 * 
 * This module contains all aggregation functions used by the PivotGrid component.
 * Each function takes an array of values and returns a single aggregated number.
 */

import type {
  AggregationFunction,
  AggregationFunctionsRegistry,
} from '../models/types';

/**
 * Sum aggregation - adds all numeric values together
 * Non-numeric values are treated as 0
 */
export const sumAggregation = (
  values: (string | number | boolean | null | undefined)[]
): number => {
  const numericValues = values.map(v => Number(v) || 0).filter(v => !isNaN(v));
  return numericValues.reduce((acc: number, val: number) => acc + val, 0);
};

/**
 * Average aggregation - calculates the arithmetic mean of numeric values
 * Non-numeric values are filtered out
 * Returns 0 if no valid numeric values exist
 */
export const avgAggregation = (
  values: (string | number | boolean | null | undefined)[]
): number => {
  const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
  return numericValues.length > 0 
    ? numericValues.reduce((acc: number, val: number) => acc + val, 0) / numericValues.length 
    : 0;
};

/**
 * Count aggregation - returns the number of values in the array
 * This counts all values, regardless of their type or validity
 */
export const countAggregation = (
  values: (string | number | boolean | null | undefined)[]
): number => values.length;

/**
 * Minimum aggregation - finds the smallest numeric value
 * Non-numeric values are filtered out
 * Returns 0 if no valid numeric values exist
 */
export const minAggregation = (
  values: (string | number | boolean | null | undefined)[]
): number => {
  const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
  return numericValues.length > 0 ? Math.min(...numericValues) : 0;
};

/**
 * Maximum aggregation - finds the largest numeric value
 * Non-numeric values are filtered out
 * Returns 0 if no valid numeric values exist
 */
export const maxAggregation = (
  values: (string | number | boolean | null | undefined)[]
): number => {
  const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
  return numericValues.length > 0 ? Math.max(...numericValues) : 0;
};

/**
 * Registry of all available aggregation functions
 * Maps aggregation function names to their implementations
 */
export const aggregationFunctions: AggregationFunctionsRegistry = {
  sum: sumAggregation,
  avg: avgAggregation,
  count: countAggregation,
  min: minAggregation,
  max: maxAggregation,
};

/**
 * Get an aggregation function by name
 * @param name - The aggregation function name
 * @returns The aggregation function implementation
 * @throws Error if the aggregation function is not found
 */
export const getAggregationFunction = (
  name: AggregationFunction
): ((values: (string | number | boolean | null | undefined)[]) => number) => {
  const func = aggregationFunctions[name];
  if (!func) {
    throw new Error(`Aggregation function '${name}' not found`);
  }
  return func;
};

/**
 * Get all available aggregation function names
 * @returns Array of aggregation function names
 */
export const getAggregationFunctionNames = (): AggregationFunction[] => {
  return Object.keys(aggregationFunctions) as AggregationFunction[];
};

/**
 * Check if an aggregation function name is valid
 * @param name - The aggregation function name to check
 * @returns true if the name is valid, false otherwise
 */
export const isValidAggregationFunction = (
  name: string
): name is AggregationFunction => {
  return name in aggregationFunctions;
};

export default aggregationFunctions;
