/**
 * Pivot Table Explorer - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the PivotGrid component
 * and related data structures.
 * 
 * For the new PivotProject model, see ./pivot-project/index.ts
 */

// ============================================================================
// DATA MODELS
// ============================================================================
export * from './pivot-project/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================


// ============================================================================
// DIMENSION VALUE MODELS
// ============================================================================

/**
 * Maps field names to their unique values for a dimension.
 * Used internally to generate row and column combinations.
 */
export type DimensionValues = Record<string, string[]>;


