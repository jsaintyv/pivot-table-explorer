/**
 * Dimension Editor Types
 * 
 * Type definitions specific to the Dimension Editor screen
 */

import type {   
  ParentMappingType, 
  GenerationMappingType, 
  MappingType 
} from '../../models/pivot-project/types';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Get mapping type options based on hierarchy mode
 */
export type HierarchyModeMappingTypes = {
  parent: ParentMappingType[];
  generation: GenerationMappingType[];
};

/**
 * Available mapping types by mode
 */
export const MAPPING_TYPES_BY_MODE: HierarchyModeMappingTypes = {
  parent: ['code', 'parentCode', 'label', 'property'],
  generation: ['root', 'gen1', 'gen2', 'gen3', 'label', 'property']
};

/**
 * Display labels for mapping types
 */
export const MAPPING_TYPE_LABELS: Record<MappingType, string> = {
  code: 'Code',
  // Parent mode types
  parentCode: 'Parent Code',
  
  // Generation mode types
  root: 'Racine',
  gen1: 'Génération 1',
  gen2: 'Génération 2',
  gen3: 'Génération 3',
  
  // Common types
  label: 'Label',
  property: 'Property'
};
