/**
 * DimensionEditorStore
 * 
 * MobX Store for the Dimension Editor screen
 * Manages state and actions specific to dimension editing
 */

import { makeObservable, action, computed, observable, runInAction } from 'mobx';
import type {
  Dimension,
  DataSource,
  LocalDataSource,
  ColumnMapping,
  PropertyMapping,
  ParentMappingType,
  GenerationMappingType,
  MappingType,
  Node,
  PivotProject,
} from '../../../models/pivot-project/types';
import { Store } from '../../../stores/Store';
import { DimensionService } from '../../../services/DimensionService';
import { MAPPING_TYPES_BY_MODE } from '../types';

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
  dimension: Dimension|null = null;  
  isLoading: boolean = false;
  errors: EditorValidationError[] = [];
  nodesByCode: Map<string, Node> = new Map();  

  constructor(mainStore: Store = Store.getInstance()) {
    this.mainStore = mainStore;
    makeObservable(this, {
      dimension: observable.ref,
      
      
      
      isLoading: observable,
      errors: observable.ref,
      nodesByCode: observable.ref,      
      loadDimension: action,
      updateName: action,
      updateDescription: action,
      updateDataType: action,      
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
      validateAll: action,
      isValid: computed,
      nameError: computed,
      dataTypeError: computed,
      hierarchyModeError: computed,
      availableMappingTypes: computed,      
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
      if (dimensionId) {
        // Load existing dimension
        const existingDim = this.mainStore.getDimension(dimensionId);
        if (existingDim) {          
          // Update nodes from mappings
          this.dimension = existingDim;
          this.updateDimensionNodes(existingDim);
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
  }

  get pivotProject() {
    return this.mainStore.pivotProject;
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
    if (! this.dimension) {
      return;
    }
    // When mode changes, we may need to update existing mappings
    // to ensure they have valid mapping types for the new mode
    const columnMappings = this.dimension!.columnMappings.map(mapping => {
      // Check if current mapping type is valid for new mode
      if (!this.isValidMappingType(mapping.mappingType as MappingType, mode)) {
        // Reset to a valid default
        return {
          ...mapping,
          mappingType: DimensionService.getDefaultMappingType(mode)
        };
      }
      return mapping;
    });
    
    // Update nodes with new hierarchy mode
    this.updateDimensionNodes({
      hierarchyMode: mode,
      columnMappings
      }
    );
  }

  // ==========================================================================
  // ACTIONS: Nodes Update
  // ==========================================================================

  /**
   * Update the dimension's nodes based on current column mappings
   * Uses DimensionService to build nodes from data sources
   */
  updateDimensionNodes(partial: Partial<Dimension>): void {
    runInAction(() => {
    if (!this.dimension || !this.dimension.id) return;
    
    const project = this.mainStore.pivotProject;
    
    // Find the dimension in the project
    const projectDimension = {...this.dimension, ...partial};
        
    // Update nodes using DimensionService
    DimensionService.updateNodesInDimension(project, projectDimension);    
    
    // Update editor's dimension nodes      
    this.dimension = projectDimension;
    this.dimension.nodes = [...(projectDimension.nodes || [])];
    this.nodesByCode = new Map();
    this.dimension.nodes.forEach(n => this.nodesByCode.set(n.id, n));

    this.validateAll();
    
    console.log("--------------------------------");
    console.log(this.nodesByCode);
    console.log(this.dimension.nodes);
    console.log(this.dimension.rootNodes);
    console.log(projectDimension.rootNodes);
    console.log("################################");
    
    });
  }

  // ==========================================================================
  // ACTIONS: Column Mappings
  // ==========================================================================

  
  addColumnMapping(dataSourceId: string, columnIndex: number, columnName: string): string {
    const id = DimensionService.getMappingId();

    const hierarchyMode = this.dimension!.hierarchyMode || "generation";

    const mapping: ColumnMapping = {
      id,
      dataSourceId,
      columnIndex,      
      name: columnName,
      level: 0, // Default level
      mappingType: DimensionService.getDefaultMappingType(hierarchyMode)
    };    
    const columnMappings = [...this.dimension!.columnMappings, mapping];    
    this.updateDimensionNodes({hierarchyMode, columnMappings});
    return id;
  }

  
  removeColumnMapping(id: string): void {
    const dimension = this.dimension;
    if(! dimension) {
      return;
    }
    const columnMappings = dimension.columnMappings.filter(m => m.id === id);
    this.updateDimensionNodes({columnMappings});
  }

  
  updateColumnMapping(
    id: string,
    updates: Partial<Omit<EditorColumnMapping, 'id'>>
  ): void {
    const dimension = this.dimension;
    if(! dimension) {
      return;
    }
    const columnMappings = dimension.columnMappings.map(mapping => {
      if (mapping.id === id) {
        return {
          ...mapping,
          ...updates
        };
      }
      return mapping;
    });
    this.updateDimensionNodes({columnMappings});
  }

  
  updateColumnMappingDataSource(id: string, dataSourceId: string): void {
    const mapping = this.dimension!.columnMappings.find(m => m.id ===id);
    if (mapping) {
      const dataSource = (this.mainStore.pivotProject.dataSources.find(ds => ds.id === dataSourceId))as LocalDataSource;
      if (dataSource) {
        // If column is no longer valid for new data source, reset it
         
        const column = dataSource.columns.find(c => c.index === mapping.columnIndex);
        const columnIndex = column ? mapping.columnIndex : 0;
        const columnName = column ? column.name : dataSource.columns[0]?.name || '';
        
        this.updateColumnMapping(id, {
          dataSourceId,
          columnIndex,
          columnName
        });
      }
    }
  }

  
  updateColumnMappingColumn(id: string, columnIndex: number, columnName: string): void {
    this.updateColumnMapping(id, {
      columnIndex,
      columnName
    });
    // updateColumnMapping already calls updateDimensionNodes
  }

  
  updateColumnMappingType(id:string, mappingType: MappingType): void {
    this.updateColumnMapping(id, {
      mappingType
    });
    // updateColumnMapping already calls updateDimensionNodes
  }

  // ==========================================================================
  // ACTIONS: Property Mappings
  // ==========================================================================

  
  addPropertyMapping(dataSourceId: string, columnIndex: number, columnName: string): string {
    const dimension = this.dimension!;    
    const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mapping: EditorPropertyMapping = {
      id,
      dataSourceId,
      columnIndex,
      columnName,
      propertyName: '',
      propertyType: 'string'
    };
    this.updateDimensionNodes({propertyMappings:  [...(dimension.propertyMappings || []), mapping]});
    return id;
  }

  
  removePropertyMapping(mappingId: string): void {
    const propertyMappings = this.dimension!.propertyMappings?.filter(m => m.id === mappingId);
    this.updateDimensionNodes({propertyMappings});
  }

  
  updatePropertyMapping(
    mappingId: string,
    updates: Partial<Omit<EditorPropertyMapping, 'id'>>
  ): void {
    const propertyMappings = (this.dimension!.propertyMappings || []).map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          ...updates
        };
      }
      return mapping;
    });
    this.updateDimensionNodes({propertyMappings});
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

    this.mainStore.updateDimension(this.dimension.id, this.dimension);

    
    return this.dimension.id;
  }

  
  cancelEditing(): void {
    if(this.dimension)  {
      this.dimension = this.mainStore.getDimension(this.dimension!.id) || null;    
    }
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
    if (this.dimension?.hierarchyMode === 'parent') {
      return MAPPING_TYPES_BY_MODE.parent;
    }
    return MAPPING_TYPES_BY_MODE.generation;
  }

  
  // ==========================================================================
  // PRIVATE: Validation Methods
  // ==========================================================================

  validateAll(): boolean {
    const dimension  = this.dimension!;
    
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

    const hierarchyMode= dimension.hierarchyMode || "generation";

    // Validate column mappings
    dimension.columnMappings.forEach((mapping, index) => {
      if (!mapping.dataSourceId) {
        errors.push({
          field: `mapping-${index}-dataSource`,
          message: 'Data source is required',
          severity: 'error'
        });
      }
      if (!mapping.name) {
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
      } else if (!this.isValidMappingType(mapping.mappingType as MappingType, hierarchyMode)) {
        errors.push({
          field: `mapping-${index}-mappingType`,
          message: `Invalid mapping type for ${hierarchyMode} mode`,
          severity: 'error'
        });
      }
    });

    // Validate property mappings
    (dimension.propertyMappings|| []).forEach((mapping, index) => {
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

  // ==========================================================================
  // PRIVATE: Utility Methods
  // ==========================================================================

  private isValidMappingType(mappingType: MappingType, mode: 'parent' | 'generation'): boolean {
    if (mode === 'parent') {
      return MAPPING_TYPES_BY_MODE.parent.includes(mappingType as ParentMappingType);
    }
    return MAPPING_TYPES_BY_MODE.generation.includes(mappingType as GenerationMappingType);
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
