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

import { action, computed, makeAutoObservable, makeObservable, observable, runInAction } from 'mobx';
import type {
  PivotProject,
  DataSource,
  LocalDataSource,
  LazyDataSource,
  Dimension,
  ColumnMapping,
  PropertyMapping,
  Node,
  MetaData,
  NodeSchema,
  View,
  Measure,
  FilterDimension,
  AggregationType,
  DataColumn,
  ValidationError,
} from '../models/pivot-project/types';
import { importCSV } from '../utils/csvParser';
import { detectColumnType, getUniqueValues, isColumnUnique } from '../utils/ParserUtils';
import { PivotProjectService } from '../services/PivotProjectService';
import { StorageService, type StoredProject } from '../services/StorageService';
import { ViewStore } from './ViewStore';
import { ToastStore } from './ToastStore';
import type { PivotData } from './ViewStore';
import { DimensionService } from '../services/DimensionService';

// ============================================================================
// STORE CLASS (Controller + Model)
// ============================================================================

export class Store {
  // MODEL: Main state
  pivotProject: PivotProject;
  activeViewId?: string;
  projectName: string = '';
  
  // BASE URL: The base path where the app is deployed (e.g., '/jsaintyv/')
  baseUrl: string = '/';
    
  // VIEW STORE: Dédié à la gestion de la vue courante
  viewStore: ViewStore;
  
  // TOAST STORE: For notifications
  toastStore: ToastStore;
  
  private static instance: Store | null = null;

  // Protected constructor allows test utilities to create instances
  protected constructor() {    
    makeObservable(this, {
      pivotProject: observable.ref,
      activeViewId: observable,
      projectName: observable,
      baseUrl: observable,  
      setBaseUrl: action,
      updateProject: action,
      setProjectName: action,
      autoSetProjectNameFromCSV: action,
      autoGenerateNameFromFilename: action,
      exportProject: action,
      importProject: action,
      saveProjectAs: action,
      loadSavedProject: action,
      listSavedProjects: action,
      
    });
    this.pivotProject = PivotProjectService.createEmptyPivotProject();
    this.viewStore = new ViewStore(this);
    this.toastStore = new ToastStore();
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
   * Set the base URL for the application
   * Used to detect where the app is deployed (e.g., '/jsaintyv/')
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Detect the base URL from the current location
   * Returns the base path where the app is deployed
   */
  static detectBaseUrl(): string {
    // If Vite's BASE_URL is configured and not root, use it
    if (import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/') {
      return import.meta.env.BASE_URL;
    }
    
    // Otherwise, detect from window.location
    if (typeof window === 'undefined') {
      return '/';
    }
    
    const pathname = window.location.pathname;
    
    // For GitHub Pages, the app is typically deployed at /repo-name/
    // The base URL is the path up to and including the repository name
    // Example: https://username.github.io/repo-name/ -> base is /repo-name/
    // Example: https://username.github.io/repo-name/page -> base is /repo-name/
    
    // Split the pathname into segments
    const segments = pathname.split('/').filter(Boolean);
    
    // If we're at the root, return /
    if (segments.length === 0) {
      return '/';
    }
    
    // Check if we're on GitHub Pages by looking at the hostname
    const hostname = window.location.hostname;
    if (hostname.endsWith('.github.io')) {
      // On GitHub Pages, the first path segment is the repository name
      // Return /repo-name/
      return `/${segments[0]}/`;
    }
    
    // For other deployments, check if the first segment looks like a base path
    // by seeing if there's a trailing slash or if we're at the root of that segment
    if (pathname.startsWith(`/${segments[0]}/`) || pathname === `/${segments[0]}`) {
      // Check if this segment doesn't contain a file extension
      if (!segments[0].includes('.')) {
        return `/${segments[0]}/`;
      }
    }
    
    // Default to root
    return '/';
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
    this.projectName = project.name || '';
  }

  /**
   * Set the project name
   */
  setProjectName(name: string): void {
    this.projectName = name;
    if (this.pivotProject) {
      this.pivotProject.name = name;
    }
  }

  /**
   * Auto-generate project name from CSV filename
   */
  autoGenerateNameFromFilename(filename: string): string {
    const basename = filename.split('/').pop() || filename;
    const nameWithoutExt = basename.split('.').slice(0, -1).join('.');
    return nameWithoutExt;
  }

  /**
   * Auto-set project name from CSV filename if project name is empty
   */
  autoSetProjectNameFromCSV(filename: string): void {
    if (!this.projectName.trim()) {
      this.projectName = this.autoGenerateNameFromFilename(filename);
      this.pivotProject.name = this.projectName;
    }
  }

  /**
   * Export the current project as JSON file
   */
  async exportProject(): Promise<void> {
    try {
      const filename = `${this.projectName || 'pivot-project'}-${new Date().toISOString().split('T')[0]}.json`;
      await StorageService.exportProjectToFile(this.pivotProject, filename);
      this.toastStore.addSuccess('Project exported successfully');
    } catch (error) {
      this.toastStore.addError((error as Error).message || 'Failed to export project');
    }
  }

  /**
   * Import a project from JSON file
   */
  async importProject(file: File): Promise<void> {
    try {
      const project = await StorageService.importProjectFromFile(file);
      this.loadProject(project);
      this.projectName = project.name || this.autoGenerateNameFromFilename(file.name);
      this.toastStore.addSuccess('Project imported successfully');
    } catch (error) {
      this.toastStore.addError((error as Error).message || 'Failed to import project');
    }
  }

  /**
   * Save the current project to IndexedDB with a specific name
   */
  async saveProjectAs(name: string): Promise<void> {
    try {
      if (!name.trim()) {
        this.toastStore.addError('Project name is required');
        return;
      }
      
      const projectToSave = {
        ...this.pivotProject,
        name,
      };
      
      await StorageService.saveProject(name, projectToSave);
      this.projectName = name;
      this.toastStore.addSuccess(`Project saved as "${name}"`);
    } catch (error) {
      this.toastStore.addError((error as Error).message || 'Failed to save project');
    }
  }

  /**
   * Load a saved project from IndexedDB by name
   */
  async loadSavedProject(name: string): Promise<void> {
    try {
      const storedProject = await StorageService.loadProject(name);
      if (storedProject) {
        this.loadProject(storedProject.pivotProject);
        this.projectName = storedProject.name;
        this.toastStore.addSuccess(`Project "${name}" loaded`);
      } else {
        this.toastStore.addError(`Project "${name}" not found`);
      }
    } catch (error) {
      this.toastStore.addError((error as Error).message || 'Failed to load project');
    }
  }

  /**
   * List all saved projects from IndexedDB
   */
  async listSavedProjects(): Promise<StoredProject[]> {
    try {
      return await StorageService.listProjects();
    } catch (error) {
      this.toastStore.addError((error as Error).message || 'Failed to list projects');
      return [];
    }
  }

  /**
   * Get the current project (for backward compatibility)
   */
  getPivotProject(): PivotProject {
    return this.pivotProject;
  }

  /**
   * Get the active view
   * Délégué à ViewStore
   */
  getActiveView(): View | undefined {
    return this.viewStore.getActiveView();
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
      columns: []
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
   * Add a new dimension
   */
  addDimension(
    name: string,
    dataType: 'string' | 'number' | 'date' | 'boolean',
    description?: string,
    columnMappings?: ColumnMapping[],
    hierarchyMode: 'parent' | 'generation' = 'generation',
    propertyMappings?: PropertyMapping[]
  ): string {
    const id = `dim-${Date.now()}`;
    const dimension: Dimension = {
      id,
      name,
      description,
      dataType,
      hierarchyMode,
      columnMappings: columnMappings || [],
      propertyMappings: propertyMappings || [],
      rootNodes: [],
      nodes: [],
      nodeSchema: undefined,
    };
    this.pivotProject.dimensions.push(dimension);
    this.pivotProject.updatedAt = new Date().toISOString();
    return id;
  }

  /**
   * Update an existing dimension
   */
  updateDimension(updated: Partial<Dimension>): void {
    if(updated.id) {
      const dim = this.pivotProject.dimensions.find(d => d.id === updated.id);
      if (dim) {
        Object.assign(dim, updated);
        this.pivotProject.updatedAt = new Date().toISOString();
      }
    } else {
      updated.id = DimensionService.getId();
      this.updateProject({dimensions: [...this.pivotProject.dimensions, updated as Dimension]});
    }
  }

  // ==========================================================================
  // EDITING DIMENSION ACTIONS
  // ==========================================================================

  /**
   * Remove a dimension by ID
   */
  removeDimension(id: string): void {
    
    var newProject = { ...this.pivotProject };    
    // Remove the dimension
    newProject.dimensions = newProject.dimensions.filter(d => d.id != id);
    
    // Remove all Nodes that belong to this dimension
    const newNodes: Record<string, Node> = {};
    Object.entries(this.pivotProject.nodes).forEach(([nodeId, node]) => {
      if (node.dimensionId !== id) {
        newNodes[nodeId] = node;
      }
    });
    newProject.nodes = newNodes;
    
    // Remove references from Views
    newProject.views.forEach(view => {
      view.rowDimensions = view.rowDimensions.filter(did => did !== id);
      view.columnDimensions = view.columnDimensions.filter(did => did !== id);
      view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== id);
    });
    
    newProject.updatedAt = new Date().toISOString();
    
    this.updateProject(newProject);
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
    Object.entries(this.pivotProject.nodes).forEach(([_parentId, parentNode]) => {
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
    return this.getDimension(dimensionId)?.nodes || [];
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
    filterDimensions?: FilterDimension[],
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
   * Délégué à ViewStore
   */
  removeView(id: string): void {
    this.viewStore.removeView(id);
    this.pivotProject.updatedAt = new Date().toISOString();
  }

  /**
   * Load a view (set as active)
   * Délégué à ViewStore
   */
  loadView(id: string): void {
    this.viewStore.loadView(id);
  }

  /**
   * Get a view by ID
   */
  getView(id: string): View | undefined {
    return this.pivotProject.views.find(v => v.id === id);
  }

  /**
   * Get all views
   * Délégué à ViewStore
   */
  getViews(): View[] {
    return this.viewStore.getViews();
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

    runInAction(() => { 
      this.pivotProject = PivotProjectService.createEmptyPivotProject();
    });
    this.activeViewId = undefined;
  }

  updateProject(update: Partial<PivotProject>) {   
      runInAction(() => { 
        this.pivotProject = {...this.pivotProject, ...update, updatedAt: new Date().toISOString() };
      });
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
          // Check if a dimension with the same name already exists
          const existingDim = dimensions.find(d => d.name === column.name);
          
          if (existingDim) {
            // Dimension exists: add new column mapping
            existingDim.columnMappings.push({
              id: DimensionService.getMappingId(),
              dataSourceId: dataSource.id,
              columnIndex: colIndex,
              level: 0,
              name: column.name,
            });
            
            // Update nodes: get unique values and add/update nodes with sourceIds
            const uniqueValues = getUniqueValues(csvData, column.name);
            uniqueValues.forEach((value) => {
              const existingNode = existingDim.nodes.find(n => n.value === value);
              if (existingNode) {
                // Node exists: add dataSource.id to sourceIds if not already present
                if (!existingNode.sourceIds.includes(dataSource.id)) {
                  existingNode.sourceIds.push(dataSource.id);
                }
              } else {
                // Create new node
                const n = PivotProjectService.buildNode(
                  existingDim.id,
                  String(value),
                  value,
                  {},
                  [],
                  [dataSource.id]
                );
                existingDim.rootNodes.push(n.id);
                existingDim.nodes.push(n);
              }
            });
          } else {
            // Dimension doesn't exist: create new dimension
            const dim = PivotProjectService.buildDimension(
              column.name,
              column.dataType as 'string' | 'number' | 'date' | 'boolean',
              `Dimension for ${column.name}`,
              [{
                  id: DimensionService.getMappingId(),
                  dataSourceId: dataSource.id,
                  columnIndex: colIndex,
                  level: 0,
                  name: column.name,
                  mappingType: DimensionService.getDefaultMappingType("generation")
              }]
            );
            dimensions.push(dim);
            
            // Create root node for this dimension
            const uniqueValues = getUniqueValues(csvData, column.name);          
            uniqueValues.forEach((value) => {
              let n = PivotProjectService.buildNode(
                dim.id,
                String(value),
                value,
                {},
                [],
                [dataSource.id]
              );
              dim.rootNodes.push(n.id);
              dim.nodes.push(n);
            });
          }
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
  FilterDimension,
  AggregationType,
  DataColumn,
  ValidationError,
};
