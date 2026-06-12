/**
 * Store - Controller in MVC Pattern
 * 
 * MobX Store that acts as the Controller, managing state (Model) and actions.
 * This is the central state management for the Pivot Table Explorer application.
 * 
 * In MVC:
 * - Model: The PivotProject state
 * - Controller: The action methods that modify the state
 * - View: React components that observe and render the state
 */

import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import type {
  PivotProject,
  DataSource,
  LocalDataSource,
  LazyDataSource,
  Dimension,
  ColumnMapping,
  Node,
  MetaData,
  NodeSchema,
  View,
  Measure,
  FilterDimension as PivotFilterDimension,
  AggregationType,
  DataColumn,
  ValidationError,
} from '../models/pivot-project/types';
import { importCSV } from '../utils/csvParser';
import { detectColumnType, getUniqueValues, isColumnUnique } from '../utils/ParserUtils';
import { PivotProjectService } from '../services/PivotProjectService';

// ============================================================================
// STORE CLASS (Controller + Model)
// ============================================================================

export class Store {
  // MODEL: Main state
  pivotProject: PivotProject;
  activeViewId?: string;
  
  private static instance: Store | null = null;

  // Protected constructor allows test utilities to create instances
  protected constructor() {    
    makeObservable(this, {
      pivotProject: observable.ref,
      activeViewId: observable,
      updateProject: action,
    });
    this.pivotProject = PivotProjectService.createEmptyPivotProject();
  }
  
  /**
   * Singleton accessor - returns the global store instance
   */
  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }
  
  /**
   * Create a new store instance for testing purposes
   * This bypasses the singleton pattern for test isolation
   */
  public static createTestInstance(): Store {
    return new Store();
  }

  // ==========================================================================
  // PROJECT ACTIONS
  // ==========================================================================

  /**
   * Create a new empty project
   */
  createProject(name?: string): void {
    this.pivotProject = PivotProjectService.createEmptyPivotProject(name);
    this.activeViewId = undefined;
  }

  /**
   * Load an existing project
   */
  loadProject(project: PivotProject): void {
    this.pivotProject = project;
    this.activeViewId = undefined;
  }

  /**
   * Export the current project
   */
  exportProject(): PivotProject {
    return this.pivotProject;
  }

  /**
   * Get the active view
   */
  getActiveView(): View | undefined {
    if (!this.activeViewId) return undefined;
    return this.pivotProject.views.find(v => v.id === this.activeViewId);
  }

  // ==========================================================================
  // DATA SOURCE ACTIONS
  // ==========================================================================

  
  /**
   * Add a LazyDataSource for JSON-API
   */
  addLazyDataSource(
    name: string,
    apiUrl: string,
    endpoint?: string,
    parameters?: Record<string, any>,
    dataSchema?: any
  ): string {
    const id = `ds-${Date.now()}`;
    const dataSource: LazyDataSource = {
      id,
      name,
      type: 'lazy',
      apiUrl,
      endpoint,
      parameters,
      dataSchema,
    };
    this.pivotProject.dataSources.push(dataSource);
    this.pivotProject.updatedAt = new Date().toISOString();
    return id;
  }

  /**
   * Remove a DataSource by ID
   */
  removeDataSource(id: string): void {
    // Remove the DataSource
    var newProject = { ...this.pivotProject };

    newProject.dataSources = newProject.dataSources.filter(ds => ds.id !== id);
    
    // Remove ColumnMappings that reference this DataSource
    newProject.dimensions.forEach(dim => {
      dim.columnMappings = dim.columnMappings.filter(cm => cm.dataSourceId !== id);
    });
    
    // Update Nodes - remove those that only have this source
    const newNodes: Record<string, Node> = {};
    Object.entries(newProject.nodes).forEach(([nodeId, node]) => {
      const newSourceIds = node.sourceIds.filter(sid => sid !== id);
      if (newSourceIds.length > 0) {
        newNodes[nodeId] = { ...node, sourceIds: newSourceIds };
      }
      // If no more sources, don't include (manual nodes would need special handling)
    });
    newProject.nodes = newNodes;
    
    newProject.updatedAt = new Date().toISOString();
    this.updateProject(newProject);
  }

  /**
   * Get a DataSource by ID
   */
  getDataSource(id: string): DataSource | undefined {
    return this.pivotProject.dataSources.find(ds => ds.id === id);
  }

  /**
   * Get all LocalDataSources
   */
  getLocalDataSources(): LocalDataSource[] {
    return this.pivotProject.dataSources.filter(
      (ds): ds is LocalDataSource => ds.type === 'local'
    );
  }

  /**
   * Get all LazyDataSources
   */
  getLazyDataSources(): LazyDataSource[] {
    return this.pivotProject.dataSources.filter(
      (ds): ds is LazyDataSource => ds.type === 'lazy'
    );
  }

  // ==========================================================================
  // DIMENSION ACTIONS
  // ==========================================================================

  

  /**
   * Update an existing dimension
   */
  updateDimension(id: string, updates: Partial<Dimension>): void {
    const dim = this.pivotProject.dimensions.find(d => d.id === id);
    if (dim) {
      Object.assign(dim, updates);
      this.pivotProject.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove a dimension by ID
   */
  removeDimension(id: string): void {
    // Remove the dimension
    this.pivotProject.dimensions = this.pivotProject.dimensions.filter(d => d.id !== id);
    
    // Remove all Nodes that belong to this dimension
    const newNodes: Record<string, Node> = {};
    Object.entries(this.pivotProject.nodes).forEach(([nodeId, node]) => {
      if (node.dimensionId !== id) {
        newNodes[nodeId] = node;
      }
    });
    this.pivotProject.nodes = newNodes;
    
    // Remove references from Views
    this.pivotProject.views.forEach(view => {
      view.rowDimensions = view.rowDimensions.filter(did => did !== id);
      view.columnDimensions = view.columnDimensions.filter(did => did !== id);
      view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== id);
    });
    
    this.pivotProject.updatedAt = new Date().toISOString();
  }

  /**
   * Get a dimension by ID
   */
  getDimension(id: string): Dimension | undefined {
    return this.pivotProject.dimensions.find(d => d.id === id);
  }

  /**
   * Get all dimensions
   */
  getDimensions(): Dimension[] {
    return this.pivotProject.dimensions;
  }

  // ==========================================================================
  // NODE ACTIONS
  // ==========================================================================

  

  /**
   * Update an existing node
   */
  updateNode(id: string, updates: Partial<Node>): void {
    const node = this.pivotProject.nodes[id];
    if (node) {
      Object.assign(node, updates);
      this.pivotProject.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove a node by ID
   */
  removeNode(id: string): void {
    const node = this.pivotProject.nodes[id];
    if (!node) return;
    
    // Remove the Node
    delete this.pivotProject.nodes[id];
    
    // Remove from rootNodes of its dimension
    const dim = this.getDimension(node.dimensionId);
    if (dim) {
      dim.rootNodes = dim.rootNodes.filter(nid => nid !== id);
    }
    
    // Remove from parent's children
    Object.entries(this.pivotProject.nodes).forEach(([parentId, parentNode]) => {
      if (parentNode.children.includes(id)) {
        parentNode.children = parentNode.children.filter(cid => cid !== id);
      }
    });
    
    this.pivotProject.updatedAt = new Date().toISOString();
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): Node | undefined {
    return this.pivotProject.nodes[id];
  }

  /**
   * Get all nodes for a dimension
   */
  getNodesByDimension(dimensionId: string): Node[] {
    return Object.values(this.pivotProject.nodes)
      .filter(node => node.dimensionId === dimensionId);
  }

  /**
   * Get root nodes for a dimension
   */
  getRootNodes(dimensionId: string): Node[] {
    const dim = this.getDimension(dimensionId);
    if (!dim) return [];
    return dim.rootNodes
      .map(id => this.pivotProject.nodes[id])
      .filter(Boolean) as Node[];
  }

  // ==========================================================================
  // VIEW ACTIONS
  // ==========================================================================

  /**
   * Add a new view
   */
  addView(
    name: string,
    rowDimensions?: string[],
    columnDimensions?: string[],
    measures?: Measure[],
    description?: string,
    filterDimensions?: PivotFilterDimension[],
    showTotals?: boolean,
    showGrandTotal?: boolean,
    sortOrder?: any[],
    formatOptions?: any
  ): string {
    const id = `view-${Date.now()}`;
    const now = new Date().toISOString();
    const view: View = {
      id,
      name,
      description,
      rowDimensions: rowDimensions || [],
      columnDimensions: columnDimensions || [],
      filterDimensions,
      measures: measures || [],
      showTotals: showTotals !== undefined ? showTotals : true,
      showGrandTotal: showGrandTotal !== undefined ? showGrandTotal : true,
      sortOrder,
      formatOptions,
      createdAt: now,
      updatedAt: now,
    };
    this.pivotProject.views.push(view);
    this.pivotProject.updatedAt = new Date().toISOString();
    return id;
  }

  /**
   * Update an existing view
   */
  updateView(id: string, updates: Partial<View>): void {
    const view = this.pivotProject.views.find(v => v.id === id);
    if (view) {
      Object.assign(view, updates);
      view.updatedAt = new Date().toISOString();
      this.pivotProject.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove a view by ID
   */
  removeView(id: string): void {
    this.pivotProject.views = this.pivotProject.views.filter(v => v.id !== id);
    if (this.activeViewId === id) {
      this.activeViewId = undefined;
    }
    this.pivotProject.updatedAt = new Date().toISOString();
  }

  /**
   * Load a view (set as active)
   */
  loadView(id: string): void {
    const view = this.pivotProject.views.find(v => v.id === id);
    if (view) {
      this.activeViewId = id;
    }
  }

  /**
   * Get a view by ID
   */
  getView(id: string): View | undefined {
    return this.pivotProject.views.find(v => v.id === id);
  }

  /**
   * Get all views
   */
  getViews(): View[] {
    return this.pivotProject.views;
  }

  // ==========================================================================
  // COMPUTED PROPERTIES / SELECTORS
  // ==========================================================================

  /**
   * Get the current pivot state as a single object
   */
  get pivotState() {
    return {
      pivotProject: this.pivotProject,
      activeViewId: this.activeViewId,
    };
  }

  // ==========================================================================
  // LEGACY COMPATIBILITY METHODS
  // ==========================================================================
  // These methods maintain backward compatibility with existing components

  // Data state (legacy)
  data: any[] = [];
  availableFields: string[] = [];
  rowFields: string[] = [];
  columnFields: string[] = [];
  valueFields: string[] = [];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum';
  filters: { dimensionId: string; selectedValues: string[] }[] = [];

  /**
   * Set the data to be pivoted (legacy)
   */
  setData(data: any[]) {
    this.data = data;
    if (data.length > 0) {
      this.availableFields = Object.keys(data[0]);
    } else {
      this.availableFields = [];
    }
  }

  /**
   * Set row fields (legacy)
   */
  setRowFields(fields: string[]) {
    this.rowFields = fields;
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.rowDimensions = fields;
      activeView.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Add a row field (legacy)
   */
  addRowField(field: string) {
    if (!this.rowFields.includes(field) && 
        !this.columnFields.includes(field) && 
        !this.valueFields.includes(field)) {
      this.rowFields = [...this.rowFields, field];
      const activeView = this.getActiveView();
      if (activeView) {
        activeView.rowDimensions = this.rowFields;
        activeView.updatedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Remove a row field (legacy)
   */
  removeRowField(field: string) {
    this.rowFields = this.rowFields.filter(f => f !== field);
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.rowDimensions = this.rowFields;
      activeView.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Set column fields (legacy)
   */
  setColumnFields(fields: string[]) {
    this.columnFields = fields;
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.columnDimensions = fields;
      activeView.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Add a column field (legacy)
   */
  addColumnField(field: string) {
    if (!this.columnFields.includes(field) && 
        !this.rowFields.includes(field) && 
        !this.valueFields.includes(field)) {
      this.columnFields = [...this.columnFields, field];
      const activeView = this.getActiveView();
      if (activeView) {
        activeView.columnDimensions = this.columnFields;
        activeView.updatedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Remove a column field (legacy)
   */
  removeColumnField(field: string) {
    this.columnFields = this.columnFields.filter(f => f !== field);
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.columnDimensions = this.columnFields;
      activeView.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Set value fields (legacy)
   */
  setValueFields(fields: string[]) {
    this.valueFields = fields;
  }

  /**
   * Add a value field (legacy)
   */
  addValueField(field: string) {
    if (!this.valueFields.includes(field) && 
        !this.rowFields.includes(field) && 
        !this.columnFields.includes(field)) {
      this.valueFields = [...this.valueFields, field];
    }
  }

  /**
   * Remove a value field (legacy)
   */
  removeValueField(field: string) {
    this.valueFields = this.valueFields.filter(f => f !== field);
  }

  /**
   * Set aggregation function (legacy)
   */
  setAggregation(aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max') {
    this.aggregation = aggregation;
    const activeView = this.getActiveView();
    if (activeView) {
      activeView.measures.forEach(m => {
        m.aggregation = aggregation as AggregationType;
      });
      activeView.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Toggle a field between categories or remove it (legacy)
   */
  toggleField(field: string, category: 'row' | 'column' | 'value') {
    this.rowFields = this.rowFields.filter(f => f !== field);
    this.columnFields = this.columnFields.filter(f => f !== field);
    this.valueFields = this.valueFields.filter(f => f !== field);
    
    if (category === 'row' && !this.rowFields.includes(field)) {
      this.rowFields = [...this.rowFields, field];
    } else if (category === 'column' && !this.columnFields.includes(field)) {
      this.columnFields = [...this.columnFields, field];
    } else if (category === 'value' && !this.valueFields.includes(field)) {
      this.valueFields = [...this.valueFields, field];
    }
  }

  /**
   * Reset all selections to initial state (legacy)
   */
  resetAll() {
    this.rowFields = [];
    this.columnFields = [];
    this.valueFields = [];
    this.aggregation = 'sum';
    this.availableFields = [];
    this.data = [];
    this.filters = [];
  }

  /**
   * Clear all state (legacy)
   */
  clear() {
    this.resetAll();
    this.pivotProject = PivotProjectService.createEmptyPivotProject();
    this.activeViewId = undefined;
  }

  updateProject(update: PivotProject) {
      console.log('Updating project:', update);
      this.pivotProject = update;
  } 

    
  importCsv(file: File) {
     importCSV(file, (columns, csvData) => {
      // Convert to row-major format (array of arrays)
        const data: any[][] = csvData.map(row => columns.map(col => row[col]));
        
        // Create DataColumn metadata
        const dataColumns: DataColumn[] = columns.map((name, index) => ({
            index,
            name,
            dataType: detectColumnType(csvData, name, index),
            nullable: false,
            unique: isColumnUnique(csvData, name),
        }));
        
        // Add the data source
        const dataSource = PivotProjectService.buildLocalDataSource(            
            file.name,
            'csv',
            dataColumns,
            data
        );
        
        const dimensions: Dimension[] = [...this.pivotProject.dimensions];
        
        // Auto-create dimensions for each column
        dataColumns.forEach((column, colIndex) => {
            
            const dim = PivotProjectService.buildDimension(
            column.name,
            column.dataType as 'string' | 'number' | 'date' | 'boolean',
            `Dimension for ${column.name}`,
            [{
                dataSourceId: dataSource.id,
                columnIndex: colIndex,
                level: 0,
                name: column.name,
            }]
            );
            dimensions.push(dim);
            
            // Create root node for this dimension
            const uniqueValues = getUniqueValues(csvData, column.name);
            uniqueValues.forEach((value) => {
            PivotProjectService.buildNode(
                dim.id,
                String(value),
                value,
                {},
                [],
                [dataSource.id]
            );
            });
        });
        this.updateProject({
            ...this.pivotProject,
            dimensions: dimensions,
            dataSources: [...this.pivotProject.dataSources, dataSource],
            updatedAt: new Date().toISOString()
        });
     });
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Export all the types for external use
export type {
  PivotProject,
  DataSource,
  LocalDataSource,
  LazyDataSource,
  Dimension,
  ColumnMapping,
  Node,
  MetaData,
  NodeSchema,
  View,
  Measure,
  PivotFilterDimension,
  AggregationType,
  DataColumn,
  ValidationError,
};
