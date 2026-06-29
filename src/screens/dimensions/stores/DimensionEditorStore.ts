/**
 * DimensionEditorStore
 * 
 * MobX Store for the Dimension Editor screen
 * Manages state and actions specific to dimension editing
 */

import { makeObservable, action, computed, observable } from 'mobx';
import type {
  Dimension,
  DataSource,
  LocalDataSource,
  ColumnMapping,
  PropertyMapping,
  ParentMappingType,
  GenerationMappingType,
  MappingType,
} from '../../../models/pivot-project/types';
import { Store } from '../../../stores/Store';

// ============================================================================
// EDITOR MAPPING TYPES
// ============================================================================

/**
 * Editor-specific column mapping with additional metadata
 */
export interface EditorColumnMapping extends ColumnMapping {
  id: string; // Unique ID for the mapping in the editor
  columnName: string; // Display name of the column
}

/**
 * Editor-specific property mapping with additional metadata
 */
export interface EditorPropertyMapping extends PropertyMapping {
  id: string; // Unique ID for the mapping in the editor
  columnName: string; // Display name of the column
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Validation error for the editor
 */
export interface EditorValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// DATA SOURCE OPTION TYPES
// ============================================================================

/**
 * Option type for data source selector
 */
export interface DataSourceOption {
  id: string;
  name: string;
  columns: DataColumnOption[];
}

/**
 * Option type for column selector
 */
export interface DataColumnOption {
  index: number;
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
}

// ============================================================================
// MAIN STORE CLASS
// ============================================================================

export class DimensionEditorStore {
  // Reference to the main store
  private mainStore: Store;

  // Editor state
  dimension: Partial<Dimension> | null = null;
  dataSources: DataSourceOption[] = [];
  columnMappings: EditorColumnMapping[] = [];
  propertyMappings: EditorPropertyMapping[] = [];
  isLoading: boolean = false;
  errors: EditorValidationError[] = [];
  hierarchyMode: 'parent' | 'generation' = 'generation';

  constructor(mainStore: Store = Store.getInstance()) {
    this.mainStore = mainStore;
    makeObservable(this, {
      dimension: observable.ref,
      dataSources: observable.ref,
      columnMappings: observable.ref,
      propertyMappings: observable.ref,
      isLoading: observable,
      errors: observable.ref,
      hierarchyMode: observable,
      loadDimension: action,
      updateName: action,
      updateDescription: action,
      updateDataType: action,
      updateHierarchyMode: action,
      addColumnMapping: action,
      removeColumnMapping: action,
      updateColumnMapping: action,
      updateColumnMappingDataSource: action,
      updateColumnMappingColumn: action,
      updateColumnMappingType: action,
      addPropertyMapping: action,
      removePropertyMapping: action,
      updatePropertyMapping: action,
      updatePropertyMappingPropertyName: action,
      saveDimension: action,
      cancelEditing: action,
      isValid: computed,
      nameError: computed,
      dataTypeError: computed,
      hierarchyModeError: computed,
      availableMappingTypes: computed,
      hierarchyPreview: computed
    });
  }

  // ==========================================================================
  // ACTIONS: Initialization
  // ==========================================================================

  /**
   * Load dimension for editing
   * If dimensionId is provided, loads existing dimension
   * Otherwise, creates a new empty dimension
   */
  
  loadDimension(dimensionId?: string): void {
    this.isLoading = true;
    this.errors = [];

    try {
      const dataSources = this.mainStore.getLocalDataSources();
      this.dataSources = this.convertToDataSourceOptions(dataSources);

      if (dimensionId) {
        // Load existing dimension
        const existingDim = this.mainStore.getDimension(dimensionId);
        if (existingDim) {
          this.dimension = { ...existingDim };
          this.hierarchyMode = existingDim.hierarchyMode || 'generation';
          this.columnMappings = this.convertToEditorColumnMappings(existingDim.columnMappings);
          this.propertyMappings = this.convertToEditorPropertyMappings(existingDim.propertyMappings || []);
        } else {
          this.createNewDimension();
        }
      } else {
        this.createNewDimension();
      }
    } catch (error) {
      this.errors = [{
        field: 'general',
        message: `Failed to load dimension: ${(error as Error).message}`,
        severity: 'error'
      }];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create a new empty dimension
   */
  
  private createNewDimension(): void {
    this.dimension = {
      id: '',
      name: '',
      description: '',
      dataType: 'string',
      hierarchyMode: 'generation',
      columnMappings: [],
      propertyMappings: [],
      rootNodes: [],
      nodes: [],
    };
    this.hierarchyMode = 'generation';
    this.columnMappings = [];
    this.propertyMappings = [];
  }

  // ==========================================================================
  // ACTIONS: Dimension Identity
  // ==========================================================================

  
  updateName(name: string): void {
    if (this.dimension) {
      this.dimension.name = name;
      this.validateName();
    }
  }

  
  updateDescription(description: string): void {
    if (this.dimension) {
      this.dimension.description = description;
    }
  }

  
  updateDataType(dataType: 'string' | 'number' | 'date' | 'boolean'): void {
    if (this.dimension) {
      this.dimension.dataType = dataType;
    }
  }

  
  updateHierarchyMode(mode: 'parent' | 'generation'): void {
    this.hierarchyMode = mode;
    if (this.dimension) {
      this.dimension.hierarchyMode = mode;
    }
    // When mode changes, we may need to update existing mappings
    // to ensure they have valid mapping types for the new mode
    this.columnMappings = this.columnMappings.map(mapping => {
      // Check if current mapping type is valid for new mode
      if (!this.isValidMappingType(mapping.mappingType as MappingType, mode)) {
        // Reset to a valid default
        return {
          ...mapping,
          mappingType: this.getDefaultMappingType(mode)
        };
      }
      return mapping;
    });
  }

  // ==========================================================================
  // ACTIONS: Column Mappings
  // ==========================================================================

  
  addColumnMapping(dataSourceId: string, columnIndex: number, columnName: string): string {
    const id = `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mapping: EditorColumnMapping = {
      id,
      dataSourceId,
      columnIndex,
      columnName,
      level: 0, // Default level
      mappingType: this.getDefaultMappingType(this.hierarchyMode)
    };
    this.columnMappings = [...this.columnMappings, mapping];
    return id;
  }

  
  removeColumnMapping(mappingId: string): void {
    this.columnMappings = this.columnMappings.filter(m => m.id !== mappingId);
  }

  
  updateColumnMapping(
    mappingId: string,
    updates: Partial<Omit<EditorColumnMapping, 'id'>>
  ): void {
    this.columnMappings = this.columnMappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          ...updates
        };
      }
      return mapping;
    });
  }

  
  updateColumnMappingDataSource(mappingId: string, dataSourceId: string): void {
    const mapping = this.columnMappings.find(m => m.id === mappingId);
    if (mapping) {
      const dataSource = this.dataSources.find(ds => ds.id === dataSourceId);
      if (dataSource) {
        // If column is no longer valid for new data source, reset it
        const column = dataSource.columns.find(c => c.index === mapping.columnIndex);
        const columnIndex = column ? mapping.columnIndex : 0;
        const columnName = column ? column.name : dataSource.columns[0]?.name || '';
        
        this.updateColumnMapping(mappingId, {
          dataSourceId,
          columnIndex,
          columnName
        });
      }
    }
  }

  
  updateColumnMappingColumn(mappingId: string, columnIndex: number, columnName: string): void {
    this.updateColumnMapping(mappingId, {
      columnIndex,
      columnName
    });
  }

  
  updateColumnMappingType(mappingId: string, mappingType: MappingType): void {
    this.updateColumnMapping(mappingId, {
      mappingType
    });
  }

  // ==========================================================================
  // ACTIONS: Property Mappings
  // ==========================================================================

  
  addPropertyMapping(dataSourceId: string, columnIndex: number, columnName: string): string {
    const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mapping: EditorPropertyMapping = {
      id,
      dataSourceId,
      columnIndex,
      columnName,
      propertyName: '',
      propertyType: 'string'
    };
    this.propertyMappings = [...this.propertyMappings, mapping];
    return id;
  }

  
  removePropertyMapping(mappingId: string): void {
    this.propertyMappings = this.propertyMappings.filter(m => m.id !== mappingId);
  }

  
  updatePropertyMapping(
    mappingId: string,
    updates: Partial<Omit<EditorPropertyMapping, 'id'>>
  ): void {
    this.propertyMappings = this.propertyMappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          ...updates
        };
      }
      return mapping;
    });
  }

  
  updatePropertyMappingPropertyName(mappingId: string, propertyName: string): void {
    this.updatePropertyMapping(mappingId, {
      propertyName
    });
  }

  // ==========================================================================
  // ACTIONS: Save and Cancel
  // ==========================================================================

  
  async saveDimension(): Promise<string> {
    if (!this.dimension) {
      throw new Error('No dimension to save');
    }

    // Validate before save
    if (!this.validateAll()) {
      throw new Error('Validation failed');
    }

    // Convert editor mappings to domain mappings
    const domainColumnMappings: ColumnMapping[] = this.columnMappings.map(m => ({
      dataSourceId: m.dataSourceId,
      columnIndex: m.columnIndex,
      level: m.level,
      name: m.name,
      mappingType: m.mappingType as MappingType
    }));

    const domainPropertyMappings: PropertyMapping[] = this.propertyMappings.map(m => ({
      id: m.id,
      dataSourceId: m.dataSourceId,
      columnIndex: m.columnIndex,
      propertyName: m.propertyName,
      propertyType: m.propertyType
    }));

    // Create full dimension object
    const dimensionToSave: Dimension = {
      ...this.dimension as Dimension,
      hierarchyMode: this.hierarchyMode,
      columnMappings: domainColumnMappings,
      propertyMappings: domainPropertyMappings,
    };

    // Save through main store
    let dimensionId: string;
    
    if (this.dimension.id) {
      // Update existing
      this.mainStore.updateDimension(this.dimension.id, dimensionToSave);
      dimensionId = this.dimension.id;
    } else {
      // Create new
      dimensionId = this.mainStore.addDimension(
        dimensionToSave.name,
        dimensionToSave.dataType,
        dimensionToSave.description,
        dimensionToSave.columnMappings
      );
      // Also save hierarchy mode and property mappings
      // Note: addDimension doesn't support these yet, so we need to update
      const newDim = this.mainStore.getDimension(dimensionId);
      if (newDim) {
        this.mainStore.updateDimension(dimensionId, {
          hierarchyMode: dimensionToSave.hierarchyMode,
          propertyMappings: dimensionToSave.propertyMappings
        });
      }
    }

    return dimensionId;
  }

  
  cancelEditing(): void {
    this.dimension = null;
    this.columnMappings = [];
    this.propertyMappings = [];
    this.errors = [];
    this.hierarchyMode = 'generation';
  }

  // ==========================================================================
  // COMPUTED: Validation
  // ==========================================================================

  
  get isValid(): boolean {
    return this.validateAll();
  }

  
  get nameError(): string | null {
    if (!this.dimension?.name?.trim()) {
      return 'Name is required';
    }
    return null;
  }

  
  get dataTypeError(): string | null {
    if (!this.dimension?.dataType) {
      return 'Data type is required';
    }
    return null;
  }

  
  get hierarchyModeError(): string | null {
    if (!this.dimension?.hierarchyMode) {
      return 'Hierarchy mode is required';
    }
    return null;
  }

  // ==========================================================================
  // COMPUTED: Available Options
  // ==========================================================================

  
  get availableMappingTypes(): MappingType[] {
    if (this.hierarchyMode === 'parent') {
      return ['parentCode', 'label', 'property'];
    }
    return ['root', 'gen1', 'gen2', 'gen3', 'label', 'property'];
  }

  // ==========================================================================
  // COMPUTED: Hierarchy Preview
  // ==========================================================================

  
  get hierarchyPreview(): { name: string; type: string; children: any[] }[] {
    if (this.hierarchyMode === 'generation') {
      return this.buildGenerationHierarchy();
    }
    return this.buildParentHierarchy();
  }

  // ==========================================================================
  // PRIVATE: Validation Methods
  // ==========================================================================

  private validateAll(): boolean {
    const errors: EditorValidationError[] = [];

    if (!this.dimension?.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
    }

    if (!this.dimension?.dataType) {
      errors.push({
        field: 'dataType',
        message: 'Data type is required',
        severity: 'error'
      });
    }

    if (!this.dimension?.hierarchyMode) {
      errors.push({
        field: 'hierarchyMode',
        message: 'Hierarchy mode is required',
        severity: 'error'
      });
    }

    // Validate column mappings
    this.columnMappings.forEach((mapping, index) => {
      if (!mapping.dataSourceId) {
        errors.push({
          field: `mapping-${index}-dataSource`,
          message: 'Data source is required',
          severity: 'error'
        });
      }
      if (!mapping.columnName) {
        errors.push({
          field: `mapping-${index}-column`,
          message: 'Column is required',
          severity: 'error'
        });
      }
      if (!mapping.mappingType) {
        errors.push({
          field: `mapping-${index}-mappingType`,
          message: 'Mapping type is required',
          severity: 'error'
        });
      } else if (!this.isValidMappingType(mapping.mappingType as MappingType, this.hierarchyMode)) {
        errors.push({
          field: `mapping-${index}-mappingType`,
          message: `Invalid mapping type for ${this.hierarchyMode} mode`,
          severity: 'error'
        });
      }
    });

    // Validate property mappings
    this.propertyMappings.forEach((mapping, index) => {
      if (!mapping.propertyName?.trim()) {
        errors.push({
          field: `property-${index}-propertyName`,
          message: 'Property name is required',
          severity: 'error'
        });
      }
    });

    this.errors = errors;
    return errors.length === 0;
  }

  private validateName(): void {
    const error = this.nameError;
    this.errors = this.errors.filter(e => e.field !== 'name');
    if (error) {
      this.errors.push({
        field: 'name',
        message: error,
        severity: 'error'
      });
    }
  }

  // ==========================================================================
  // PRIVATE: Conversion Methods
  // ==========================================================================

  private convertToDataSourceOptions(dataSources: LocalDataSource[]): DataSourceOption[] {
    return dataSources.map(ds => ({
      id: ds.id,
      name: ds.name,
      columns: ds.columns.map(col => ({
        index: col.index,
        name: col.name,
        dataType: col.dataType
      }))
    }));
  }

  private convertToEditorColumnMappings(columnMappings: ColumnMapping[]): EditorColumnMapping[] {
    return columnMappings.map((mapping, index) => {
      const dataSource = this.dataSources.find(ds => ds.id === mapping.dataSourceId);
      const columnName = dataSource?.columns.find(c => c.index === mapping.columnIndex)?.name || 
                        `Column ${mapping.columnIndex}`;
      
      return {
        id: `mapping-${index}`,
        ...mapping,
        columnName
      };
    });
  }

  private convertToEditorPropertyMappings(propertyMappings: PropertyMapping[]): EditorPropertyMapping[] {
    return propertyMappings.map((mapping, index) => {
      const dataSource = this.dataSources.find(ds => ds.id === mapping.dataSourceId);
      const columnName = dataSource?.columns.find(c => c.index === mapping.columnIndex)?.name || 
                        `Column ${mapping.columnIndex}`;
      
      return {
        ...mapping,
        id: mapping.id || `prop-${index}`,
        columnName
      };
    });
  }

  // ==========================================================================
  // PRIVATE: Hierarchy Builders
  // ==========================================================================

  private buildGenerationHierarchy(): { name: string; type: string; children: any[] }[] {
    // For generation mode, we need to build hierarchy based on mapping types
    // Group mappings by data source and build levels
    const rootMappings = this.columnMappings.filter(m => m.mappingType === 'root');
    const gen1Mappings = this.columnMappings.filter(m => m.mappingType === 'gen1');
    const gen2Mappings = this.columnMappings.filter(m => m.mappingType === 'gen2');
    const gen3Mappings = this.columnMappings.filter(m => m.mappingType === 'gen3');

    const result: { name: string; type: string; children: any[] }[] = [];

    // For each root mapping, find its children
    rootMappings.forEach(root => {
      const rootChildren = gen1Mappings
        .filter(g1 => g1.dataSourceId === root.dataSourceId)
        .map(g1 => ({
          name: g1.columnName,
          type: 'Génération 1',
          children: gen2Mappings
            .filter(g2 => g2.dataSourceId === root.dataSourceId)
            .map(g2 => ({
              name: g2.columnName,
              type: 'Génération 2',
              children: gen3Mappings
                .filter(g3 => g3.dataSourceId === root.dataSourceId)
                .map(g3 => ({
                  name: g3.columnName,
                  type: 'Génération 3',
                  children: []
                }))
            }))
        }));

      result.push({
        name: root.columnName,
        type: 'Racine',
        children: rootChildren
      });
    });

    return result;
  }

  private buildParentHierarchy(): { name: string; type: string; children: any[] }[] {
    // For parent mode, hierarchy is built via parent codes
    // This is a simplified preview - actual hierarchy would need data
    const parentCodeMappings = this.columnMappings.filter(m => m.mappingType === 'parentCode');
    const labelMappings = this.columnMappings.filter(m => m.mappingType === 'label');

    // Show which columns are mapped to what
    return [
      {
        name: 'Parent Code Column',
        type: 'Parent Code',
        children: parentCodeMappings.map(m => ({
          name: m.columnName,
          type: 'Parent Reference',
          children: []
        }))
      },
      {
        name: 'Label Column',
        type: 'Label',
        children: labelMappings.map(m => ({
          name: m.columnName,
          type: 'Display Name',
          children: []
        }))
      }
    ];
  }

  // ==========================================================================
  // PRIVATE: Utility Methods
  // ==========================================================================

  private isValidMappingType(mappingType: MappingType, mode: 'parent' | 'generation'): boolean {
    if (mode === 'parent') {
      return ['parentCode', 'label', 'property'].includes(mappingType as ParentMappingType);
    }
    return ['root', 'gen1', 'gen2', 'gen3', 'label', 'property'].includes(mappingType as GenerationMappingType);
  }

  private getDefaultMappingType(mode: 'parent' | 'generation'): MappingType {
    return mode === 'parent' ? 'parentCode' : 'root';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let dimensionEditorStoreInstance: DimensionEditorStore | null = null;

export const getDimensionEditorStore = (): DimensionEditorStore => {
  if (!dimensionEditorStoreInstance) {
    dimensionEditorStoreInstance = new DimensionEditorStore();
  }
  return dimensionEditorStoreInstance;
};

export const resetDimensionEditorStore = (): void => {
  dimensionEditorStoreInstance = null;
};
