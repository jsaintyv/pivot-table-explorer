# Plan de Développement - Migration vers PivotProject

## 🎯 Objectif

Migrer le modèle actuel vers le nouveau modèle **PivotProject** tel que défini dans la documentation, avec :
- **PivotProject** comme racine
- **DataSource** (Local/Lazy)
- **Dimension** avec ColumnMappings et hiérarchie
- **Node** avec MetaData typée et support multi-source
- **View** avec mesures et calculs
- Sérialisation/desérialisation JSON complète

---

## 📋 Sommaire

1. [Création des nouvelles interfaces TypeScript](#1-création-des-nouvelles-interfaces-typescript)
2. [Mise à jour du Store](#2-mise-à-jour-du-store)
3. [Migration des données existantes](#3-migration-des-données-existantes)
4. [Implémentation de la sérialisation](#4-implémentation-de-la-sérialisation)
5. [Validation et tests](#5-validation-et-tests)
6. [Nettoyage et suppression de l'ancien code](#6-nettoyage-et-suppression-de-lancien-code)

---

## 1. ✅ Création des nouvelles interfaces TypeScript

### 1.1. Créer `/src/models/pivot-project/types.ts`

**Nouveau fichier** avec toutes les interfaces du modèle PivotProject.

```typescript
// ============================================================================
// PIVOT PROJECT CORE TYPES
// ============================================================================

/**
 * Main project container
 */
export interface PivotProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  dataSources: DataSource[];
  dimensions: Dimension[];
  nodes: Record<string, Node>; // Node ID -> Node
  views: View[];
}

// ============================================================================
// DATA SOURCE TYPES
// ============================================================================

/**
 * Base type for all data sources
 */
export type DataSource = LocalDataSource | LazyDataSource;

/**
 * Common fields for all data sources
 */
export interface BaseDataSource {
  id: string;
  name: string;
  type: 'local' | 'lazy';
}

/**
 * Data that has been loaded from CSV or Excel and is embedded in the project
 */
export interface LocalDataSource extends BaseDataSource {
  type: 'local';
  originalFormat: 'csv' | 'excel';  
  loadedAt: string; // ISO 8601
  columns: DataColumn[];
  data: any[][]; // Row-major: array of rows, each row is array of values
}

/**
 * Data accessible via JSON-API (fetched on demand)
 */
export interface LazyDataSource extends BaseDataSource {
  type: 'lazy';
  apiUrl: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  dataSchema?: any;
}

/**
 * Metadata about a column in a data source
 */
export interface DataColumn {
  index: number;
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  nullable: boolean;
  unique: boolean;
}

// ============================================================================
// DIMENSION TYPES
// ============================================================================

/**
 * Logical grouping of related values (Nodes)
 */
export interface Dimension {
  id: string;
  name: string;
  description?: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  columnMappings: ColumnMapping[];
  rootNodes: string[]; // IDs of root nodes in this dimension's hierarchy
  nodeSchema?: NodeSchema;
}

/**
 * Maps a dimension to columns in data sources
 */
export interface ColumnMapping {
  dataSourceId: string;
  columnIndex: number;
  level: number; // 0 = root, 1 = child, etc.
  name?: string; // Optional custom name for this level
}

/**
 * Schema for Node metadata in a dimension
 */
export interface NodeSchema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'date';
  required: boolean;
  defaultValue?: any;
}

// ============================================================================
// NODE TYPES
// ============================================================================

/**
 * A specific value within a dimension
 */
export interface Node {
  id: string; // Global unique identifier
  dimensionId: string; // ID of the dimension this node belongs to
  code: string; // Unique code within the dimension
  value: string | number | Date | boolean; // The actual value
  metaData: MetaData; // Typed metadata
  children: string[]; // IDs of child nodes
  sourceIds: string[]; // IDs of DataSources this node originates from
}

/**
 * Typed metadata for a node
 * Keys are field names from the dimension's NodeSchema
 */
export type MetaData = Record<string, string | number | boolean | Date | null>;

// ============================================================================
// VIEW TYPES
// ============================================================================

/**
 * A pivot table configuration (cross-tabulation)
 */
export interface View {
  id: string;
  name: string;
  description?: string;
  
  // Axes
  rowDimensions: string[]; // Dimension IDs for row axis
  columnDimensions: string[]; // Dimension IDs for column axis
  filterDimensions?: FilterDimension[];
  
  // Data
  measures: Measure[];
  
  // Display
  showTotals: boolean;
  showGrandTotal: boolean;
  sortOrder?: SortConfig[];
  formatOptions?: FormatOptions;
  
  // State
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Filter configuration for a dimension
 */
export interface FilterDimension {
  dimensionId: string;
  selectedNodes: string[]; // Array of Node IDs to include/exclude
  operator: 'include' | 'exclude';
}

/**
 * A metric to display in the pivot table
 */
export interface Measure {
  id: string;
  name: string;
  source: MeasureSource;
  aggregation: AggregationType;
  format?: string; // Format string (e.g., "€#,##0.00", "0.00%")
  visible: boolean;
}

/**
 * Where the measure data comes from
 */
export type MeasureSource = 
  | { type: 'column'; dataSourceId: string; columnIndex: number }
  | { type: 'calculated'; expression: string };

/**
 * How to aggregate values
 */
export type AggregationType = 
  | 'sum'
  | 'average'
  | 'count'
  | 'min'
  | 'max'
  | 'first'
  | 'last';

/**
 * Sorting configuration
 */
export interface SortConfig {
  dimensionId: string;
  direction: 'asc' | 'desc';
  mode: 'byValue' | 'byCode' | 'byName' | 'custom';
  measureId?: string; // For sorting by measure value
}

/**
 * Number/date formatting options
 */
export interface FormatOptions {
  numberFormat?: string;
  dateFormat?: string;
  showZeros?: boolean;
  showNulls?: boolean;
  decimalSeparator?: string;
  thousandSeparator?: string;
}

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Root wrapper for serialized PivotProject
 */
export interface SerializedPivotProject {
  version: string; // Schema version (e.g., "1.0")
  pivotProject: PivotProject;
}

/**
 * Validation error for deserialization
 */
export interface ValidationError {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Result of deserialization
 */
export interface DeserializationResult {
  project?: PivotProject;
  errors: ValidationError[];
}
```

### 1.2. Mettre à jour `/src/models/types.ts`

**Conserver** les types existants pour la compatibilité temporaire, mais **ajouter des exports** vers les nouveaux types :

```typescript
// Re-export new types from pivot-project
export * from './pivot-project/types';
```

**Statut**: ⏳ À faire
**Priorité**: Haute
**Fichier**: `/src/models/types.ts`

---

## 2. 🔧 Mise à jour du Store

### 2.1. Modifier `/src/store/Store.ts`

#### 2.1.1. Remplacer les interfaces existantes

**Supprimer** :
- `SourceFile`
- `Dimension` (ancienne version)
- `FilterConfig`
- `View` (ancienne version)

**Ajouter** :
```typescript
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
  FilterDimension,
  AggregationType,
} from '../models/pivot-project/types';
```

#### 2.1.2. Modifier la classe Store

**Remplacer les propriétés existantes** :

```typescript
// ANCIEN:
rowFields: string[] = [];
columnFields: string[] = [];
valueFields: string[] = [];
aggregation: AggregationFunction = 'sum';
availableFields: string[] = [];
data: any[] = [];
sourceFiles: SourceFile[] = [];
dimensions: Dimension[] = [];
filters: FilterConfig[] = [];
views: View[] = [];

// NOUVEAU:
// State principal
pivotProject: PivotProject = createEmptyPivotProject();
activeProjectId?: string; // Pour gérer plusieurs projets

// State temporaire pour l'UI (optionnel, peut être dérivé)
activeViewId?: string;
selectedDataSourceId?: string;
```

**Helper function** :
```typescript
function createEmptyPivotProject(): PivotProject {
  return {
    id: `project-${Date.now()}`,
    name: 'Untitled Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSources: [],
    dimensions: [],
    nodes: {},
    views: [],
  };
}
```

#### 2.1.3. Mettre à jour les méthodes

**DataSource Methods** :
```typescript
// Ajouter une LocalDataSource
addLocalDataSource(dataSource: Omit<LocalDataSource, 'id' | 'type' | 'loadedAt'> & { data: any[][]; columns: DataColumn[] }): string {
  const id = `ds-${Date.now()}`;
  const newDataSource: LocalDataSource = {
    id,
    type: 'local',
    name: dataSource.name,
    originalFormat: dataSource.originalFormat,    
    loadedAt: new Date().toISOString(),
    columns: dataSource.columns,
    data: dataSource.data,
  };
  this.pivotProject.dataSources.push(newDataSource);
  this.pivotProject.updatedAt = new Date().toISOString();
  return id;
}

// Ajouter une LazyDataSource
addLazyDataSource(dataSource: Omit<LazyDataSource, 'id' | 'type'>): string {
  const id = `ds-${Date.now()}`;
  const newDataSource: LazyDataSource = {
    id,
    type: 'lazy',
    name: dataSource.name,
    apiUrl: dataSource.apiUrl,
    endpoint: dataSource.endpoint,
    parameters: dataSource.parameters,
    dataSchema: dataSource.dataSchema,
  };
  this.pivotProject.dataSources.push(newDataSource);
  this.pivotProject.updatedAt = new Date().toISOString();
  return id;
}

// Supprimer une DataSource
removeDataSource(id: string): void {
  // Supprimer la DataSource
  this.pivotProject.dataSources = this.pivotProject.dataSources.filter(ds => ds.id !== id);
  
  // Supprimer les ColumnMappings qui référencent cette DataSource
  this.pivotProject.dimensions.forEach(dim => {
    dim.columnMappings = dim.columnMappings.filter(cm => cm.dataSourceId !== id);
  });
  
  // Mettre à jour les Nodes (supprimer ceux qui n'ont plus de source)
  const newNodes: Record<string, Node> = {};
  Object.entries(this.pivotProject.nodes).forEach(([nodeId, node]) => {
    const newSourceIds = node.sourceIds.filter(sid => sid !== id);
    if (newSourceIds.length > 0) {
      newNodes[nodeId] = { ...node, sourceIds: newSourceIds };
    }
    // Si plus de sources, on supprime le Node (sauf si c'est un Node manuel)
  });
  this.pivotProject.nodes = newNodes;
  
  this.pivotProject.updatedAt = new Date().toISOString();
}

getDataSource(id: string): DataSource | undefined {
  return this.pivotProject.dataSources.find(ds => ds.id === id);
}
```

**Dimension Methods** :
```typescript
addDimension(dimension: Omit<Dimension, 'id' | 'rootNodes'> & { rootNodes?: string[] }): string {
  const id = `dim-${Date.now()}`;
  const newDimension: Dimension = {
    id,
    name: dimension.name,
    description: dimension.description,
    dataType: dimension.dataType,
    columnMappings: dimension.columnMappings || [],
    rootNodes: dimension.rootNodes || [],
    nodeSchema: dimension.nodeSchema,
  };
  this.pivotProject.dimensions.push(newDimension);
  this.pivotProject.updatedAt = new Date().toISOString();
  return id;
}

updateDimension(id: string, updates: Partial<Dimension>): void {
  const dim = this.pivotProject.dimensions.find(d => d.id === id);
  if (dim) {
    Object.assign(dim, updates);
    this.pivotProject.updatedAt = new Date().toISOString();
  }
}

removeDimension(id: string): void {
  // Supprimer la dimension
  this.pivotProject.dimensions = this.pivotProject.dimensions.filter(d => d.id !== id);
  
  // Supprimer tous les Nodes qui appartiennent à cette dimension
  const newNodes: Record<string, Node> = {};
  Object.entries(this.pivotProject.nodes).forEach(([nodeId, node]) => {
    if (node.dimensionId !== id) {
      newNodes[nodeId] = node;
    }
  });
  this.pivotProject.nodes = newNodes;
  
  // Supprimer les références dans les Views
  this.pivotProject.views.forEach(view => {
    view.rowDimensions = view.rowDimensions.filter(did => did !== id);
    view.columnDimensions = view.columnDimensions.filter(did => did !== id);
    view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== id);
  });
  
  this.pivotProject.updatedAt = new Date().toISOString();
}

getDimension(id: string): Dimension | undefined {
  return this.pivotProject.dimensions.find(d => d.id === id);
}
```

**Node Methods** :
```typescript
addNode(node: Omit<Node, 'id'>): string {
  const id = `node-${Date.now()}`;
  const newNode: Node = {
    id,
    dimensionId: node.dimensionId,
    code: node.code,
    value: node.value,
    metaData: node.metaData || {},
    children: node.children || [],
    sourceIds: node.sourceIds || [],
  };
  this.pivotProject.nodes[id] = newNode;
  
  // Mettre à jour les rootNodes de la dimension si nécessaire
  const dim = this.getDimension(node.dimensionId);
  if (dim && !dim.rootNodes.includes(id)) {
    dim.rootNodes.push(id);
  }
  
  this.pivotProject.updatedAt = new Date().toISOString();
  return id;
}

updateNode(id: string, updates: Partial<Node>): void {
  const node = this.pivotProject.nodes[id];
  if (node) {
    Object.assign(node, updates);
    this.pivotProject.updatedAt = new Date().toISOString();
  }
}

removeNode(id: string): void {
  const node = this.pivotProject.nodes[id];
  if (!node) return;
  
  // Supprimer le Node
  delete this.pivotProject.nodes[id];
  
  // Supprimer de rootNodes de sa dimension
  const dim = this.getDimension(node.dimensionId);
  if (dim) {
    dim.rootNodes = dim.rootNodes.filter(nid => nid !== id);
  }
  
  // Supprimer des enfants de son parent (il faut trouver le parent)
  Object.entries(this.pivotProject.nodes).forEach(([parentId, parentNode]) => {
    if (parentNode.children.includes(id)) {
      parentNode.children = parentNode.children.filter(cid => cid !== id);
    }
  });
  
  this.pivotProject.updatedAt = new Date().toISOString();
}

getNode(id: string): Node | undefined {
  return this.pivotProject.nodes[id];
}

getNodesByDimension(dimensionId: string): Node[] {
  return Object.values(this.pivotProject.nodes)
    .filter(node => node.dimensionId === dimensionId);
}
```

**View Methods** :
```typescript
addView(view: Omit<View, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = `view-${Date.now()}`;
  const now = new Date().toISOString();
  const newView: View = {
    id,
    name: view.name,
    description: view.description,
    rowDimensions: view.rowDimensions || [],
    columnDimensions: view.columnDimensions || [],
    filterDimensions: view.filterDimensions,
    measures: view.measures || [],
    showTotals: view.showTotals !== undefined ? view.showTotals : true,
    showGrandTotal: view.showGrandTotal !== undefined ? view.showGrandTotal : true,
    sortOrder: view.sortOrder,
    formatOptions: view.formatOptions,
    createdAt: now,
    updatedAt: now,
  };
  this.pivotProject.views.push(newView);
  this.pivotProject.updatedAt = new Date().toISOString();
  return id;
}

updateView(id: string, updates: Partial<View>): void {
  const view = this.pivotProject.views.find(v => v.id === id);
  if (view) {
    Object.assign(view, updates);
    view.updatedAt = new Date().toISOString();
    this.pivotProject.updatedAt = new Date().toISOString();
  }
}

removeView(id: string): void {
  this.pivotProject.views = this.pivotProject.views.filter(v => v.id !== id);
  this.pivotProject.updatedAt = new Date().toISOString();
}

loadView(id: string): void {
  const view = this.pivotProject.views.find(v => v.id === id);
  if (view) {
    this.activeViewId = id;
    // Optionnel: charger les dimensions sélectionnées dans l'UI
  }
}

getView(id: string): View | undefined {
  return this.pivotProject.views.find(v => v.id === id);
}
```

**Project Methods** :
```typescript
// Créer un nouveau projet
createProject(name?: string): void {
  this.pivotProject = createEmptyPivotProject();
  if (name) {
    this.pivotProject.name = name;
  }
}

// Charger un projet existant
loadProject(project: PivotProject): void {
  this.pivotProject = project;
  this.activeViewId = undefined;
}

// Exporter le projet actuel
exportProject(): PivotProject {
  return this.pivotProject;
}

// Sauvegarder le projet (appelle la sérialisation)
async saveProject(filePath?: string): Promise<void> {
  // À implémenter avec la sérialisation
}

// Charger un projet depuis un fichier
async loadProjectFromFile(filePath: string): Promise<{ success: boolean; errors: ValidationError[] }> {
  // À implémenter avec la désérialisation
  return { success: false, errors: [] };
}
```

#### 2.1.4. Mettre à jour les méthodes existantes

**Adapter les méthodes pour travailler avec le nouveau modèle** :

```typescript
// setData -> Écrasé par loadProject
// Les méthodes addRowField, addColumnField, etc. peuvent devenir des helpers
// ou être supprimées au profit des nouvelles méthodes

// Garder pour la compatibilité temporaire :
setRowFields(fields: string[]) {
  const activeView = this.getView(this.activeViewId || '');
  if (activeView) {
    activeView.rowDimensions = fields;
    activeView.updatedAt = new Date().toISOString();
  }
}

setColumnFields(fields: string[]) {
  const activeView = this.getView(this.activeViewId || '');
  if (activeView) {
    activeView.columnDimensions = fields;
    activeView.updatedAt = new Date().toISOString();
  }
}

setValueFields(fields: string[]) {
  // Dans le nouveau modèle, les value fields sont définis dans les mesures
  // Cette méthode peut être adaptée ou supprimée
}

setAggregation(aggregation: AggregationFunction) {
  const activeView = this.getView(this.activeViewId || '');
  if (activeView) {
    activeView.measures.forEach(m => {
      if (m.aggregation) {
        m.aggregation = aggregation as AggregationType;
      }
    });
    activeView.updatedAt = new Date().toISOString();
  }
}
```

**Statut**: ⏳ À faire
**Priorité**: Haute
**Fichier**: `/src/store/Store.ts`

---

## 3. 🔄 Migration des données existantes

### 3.1. Créer un utilitaire de migration

**Nouveau fichier** : `/src/models/pivot-project/migration.ts`

```typescript
import type {
  PivotProject,
  LocalDataSource,
  Dimension,
  Node,
  View as NewView,
} from './types';
import type { Store as OldStore } from '../../store/Store';

/**
 * Convertir l'ancien modèle SourceFile en LocalDataSource
 */
function convertSourceFileToDataSource(oldSourceFile: any): LocalDataSource {
  // Générer des colonnes par défaut
  const columns = oldSourceFile.columns?.map((name: string, index: number) => ({
    index,
    name,
    dataType: 'unknown' as const,
    nullable: true,
    unique: false,
  })) || [];
  
  return {
    id: oldSourceFile.id || `ds-${Date.now()}`,
    type: 'local',
    name: oldSourceFile.name || 'Untitled',
    originalFormat: 'csv' as const, // Par défaut
    loadedAt: new Date().toISOString(),
    columns,
    data: [], // Les données devront être chargées séparément
  };
}

/**
 * Convertir l'ancienne Dimension en nouvelle Dimension
 */
function convertOldDimensionToDimension(oldDim: any, dataSourceId: string): Dimension {
  return {
    id: oldDim.id || `dim-${Date.now()}`,
    name: oldDim.name || 'Untitled',
    dataType: 'string' as const, // Par défaut, à détecter
    columnMappings: [
      {
        dataSourceId,
        columnIndex: 0, // À mapper correctement
        level: 0,
        name: oldDim.columnName,
      },
    ],
    rootNodes: [], // À remplir après la création des Nodes
    nodeSchema: undefined,
  };
}

/**
 * Convertir une ancienne View en nouvelle View
 */
function convertOldViewToView(oldView: any): NewView {
  const measures = oldView.valueFields?.map((field: string, index: number) => ({
    id: `measure-${index}`,
    name: field,
    source: { type: 'column' as const, dataSourceId: '', columnIndex: 0 },
    aggregation: (oldView.aggregation || 'sum') as any,
    format: undefined,
    visible: true,
  })) || [];
  
  return {
    id: oldView.id || `view-${Date.now()}`,
    name: oldView.name || 'Untitled',
    description: undefined,
    rowDimensions: oldView.rowFields || [],
    columnDimensions: oldView.columnFields || [],
    filterDimensions: oldView.filters?.map((f: any) => ({
      dimensionId: f.dimensionId,
      selectedNodes: f.selectedValues,
      operator: 'include' as const,
    })),
    measures,
    showTotals: true,
    showGrandTotal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Migration complète d'un ancien store vers PivotProject
 */
export function migrateFromOldStore(oldStore: OldStore): PivotProject {
  const project: PivotProject = {
    id: `project-migrated-${Date.now()}`,
    name: 'Migrated Project',
    description: 'Project migrated from old format',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSources: [],
    dimensions: [],
    nodes: {},
    views: [],
  };
  
  // Migrer les sourceFiles
  project.dataSources = oldStore.sourceFiles.map(convertSourceFileToDataSource);
  
  // Migrer les dimensions
  const dataSourceId = project.dataSources[0]?.id || '';
  project.dimensions = oldStore.dimensions.map(oldDim =>
    convertOldDimensionToDimension(oldDim, dataSourceId)
  );
  
  // Créer des Nodes basiques pour chaque dimension
  // (Ceci est une migration minimale - les Nodes devront être complétés)
  project.dimensions.forEach(dim => {
    // Créer un Node racine par défaut
    const nodeId = `node-${dim.id}-root`;
    project.nodes[nodeId] = {
      id: nodeId,
      dimensionId: dim.id,
      code: dim.name.toUpperCase().replace(/\s+/g, '_'),
      value: dim.name,
      metaData: {},
      children: [],
      sourceIds: [dataSourceId],
    };
    dim.rootNodes.push(nodeId);
  });
  
  // Migrer les views
  project.views = oldStore.views.map(convertOldViewToView);
  
  return project;
}
```

**Statut**: ⏳ À faire
**Priorité**: Moyenne
**Fichier**: `/src/models/pivot-project/migration.ts`

---

## 4. 💾 Implémentation de la sérialisation

### 4.1. Créer `/src/models/pivot-project/serialization.ts`

```typescript
import type {
  PivotProject,
  SerializedPivotProject,
  DeserializationResult,
  ValidationError,
} from './types';

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Sérialiser un PivotProject en JSON
 */
export function serializePivotProject(project: PivotProject): string {
  const wrapper: SerializedPivotProject = {
    version: '1.0',
    pivotProject: {
      ...project,
      // Convertir les Dates en strings ISO
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      dataSources: project.dataSources.map(ds => {
        if (ds.type === 'local') {
          return {
            ...ds,
            loadedAt: ds.loadedAt,
          };
        }
        return { ...ds };
      }),
      nodes: Object.fromEntries(
        Object.entries(project.nodes).map(([id, node]) => [
          id,
          {
            ...node,
            // Convertir value si Date
            value: node.value instanceof Date ? node.value.toISOString() : node.value,
            metaData: Object.fromEntries(
              Object.entries(node.metaData).map(([k, v]) => [
                k,
                v instanceof Date ? v.toISOString() : v,
              ])
            ),
          },
        ])
      ),
      views: project.views.map(view => ({
        ...view,
        createdAt: view.createdAt,
        updatedAt: view.updatedAt,
      })),
    },
  };
  
  return JSON.stringify(wrapper, null, 2);
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Désérialiser un JSON en PivotProject
 */
export function deserializePivotProject(jsonString: string): DeserializationResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    return {
      errors: [
        {
          code: 'INVALID_JSON',
          path: '',
          message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        },
      ],
    };
  }
  
  // Vérifier la structure de base
  if (!parsed?.version) {
    return {
      errors: [
        {
          code: 'MISSING_VERSION',
          path: '',
          message: 'Missing version field in root object',
          severity: 'error',
        },
      ],
    };
  }
  
  if (!parsed.pivotProject) {
    return {
      errors: [
        {
          code: 'MISSING_PIVOT_PROJECT',
          path: '',
          message: 'Missing pivotProject field in root object',
          severity: 'error',
        },
      ],
    };
  }
  
  const projectData = parsed.pivotProject;
  const errors: ValidationError[] = [];
  
  // Valider et convertir les Dates
  const project: any = {
    ...projectData,
    createdAt: new Date(projectData.createdAt).toISOString(),
    updatedAt: new Date(projectData.updatedAt).toISOString(),
    dataSources: projectData.dataSources?.map((ds: any) => {
      if (ds.type === 'local') {
        return {
          ...ds,
          loadedAt: new Date(ds.loadedAt).toISOString(),
        };
      }
      return { ...ds };
    }) || [],
    nodes: Object.fromEntries(
      Object.entries(projectData.nodes || {}).map(([id, node]: [string, any]) => [
        id,
        {
          ...node,
          value: convertValue(node.value),
          metaData: Object.fromEntries(
            Object.entries(node.metaData || {}).map(([k, v]) => [
              k,
              convertValue(v),
            ])
          ),
        },
      ])
    ),
    views: projectData.views?.map((view: any) => ({
      ...view,
      createdAt: new Date(view.createdAt).toISOString(),
      updatedAt: new Date(view.updatedAt).toISOString(),
    })) || [],
  };
  
  // Valider les références
  const referenceErrors = validateReferences(project);
  errors.push(...referenceErrors);
  
  // Valider les contraintes
  const constraintErrors = validateConstraints(project);
  errors.push(...constraintErrors);
  
  // Si des erreurs fatales, ne pas retourner le projet
  const fatalErrors = errors.filter(e => e.severity === 'error');
  if (fatalErrors.length > 0) {
    return { errors };
  }
  
  return {
    project: project as PivotProject,
    errors: errors.filter(e => e.severity === 'warning'),
  };
}

/**
 * Convertir une valeur JSON en son type TypeScript
 */
function convertValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    // Tester si c'est une date ISO
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return value;
  }
  
  return value;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valider l'intégrité des références
 */
function validateReferences(project: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const dataSourceIds = new Set(project.dataSources?.map((ds: any) => ds.id) || []);
  const dimensionIds = new Set(project.dimensions?.map((d: any) => d.id) || []);
  const nodeIds = new Set(Object.keys(project.nodes || {}));
  
  // Valider les ColumnMappings
  project.dimensions?.forEach((dim: any, dimIndex: number) => {
    dim.columnMappings?.forEach((cm: any, cmIndex: number) => {
      if (!dataSourceIds.has(cm.dataSourceId)) {
        errors.push({
          code: 'INVALID_DATA_SOURCE_REFERENCE',
          path: `pivotProject.dimensions[${dimIndex}].columnMappings[${cmIndex}].dataSourceId`,
          message: `DataSource '${cm.dataSourceId}' not found`,
          severity: 'error',
        });
      }
      
      // Valider que columnIndex existe dans la DataSource
      const ds = project.dataSources?.find((d: any) => d.id === cm.dataSourceId);
      if (ds && ds.type === 'local' && cm.columnIndex >= ds.columns?.length) {
        errors.push({
          code: 'INVALID_COLUMN_INDEX',
          path: `pivotProject.dimensions[${dimIndex}].columnMappings[${cmIndex}].columnIndex`,
          message: `Column index ${cm.columnIndex} out of range for DataSource '${cm.dataSourceId}'`,
          severity: 'error',
        });
      }
    });
  });
  
  // Valider les rootNodes
  project.dimensions?.forEach((dim: any, dimIndex: number) => {
    dim.rootNodes?.forEach((nodeId: string) => {
      if (!nodeIds.has(nodeId)) {
        errors.push({
          code: 'INVALID_NODE_REFERENCE',
          path: `pivotProject.dimensions[${dimIndex}].rootNodes`,
          message: `Node '${nodeId}' not found`,
          severity: 'error',
        });
      }
    });
  });
  
  // Valider les Nodes
  Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
    if (!dimensionIds.has(node.dimensionId)) {
      errors.push({
        code: 'INVALID_DIMENSION_REFERENCE',
        path: `pivotProject.nodes.${nodeId}.dimensionId`,
        message: `Dimension '${node.dimensionId}' not found`,
        severity: 'error',
      });
    }
    
    // Valider les enfants
    node.children?.forEach((childId: string) => {
      if (!nodeIds.has(childId)) {
        errors.push({
          code: 'INVALID_CHILD_NODE_REFERENCE',
          path: `pivotProject.nodes.${nodeId}.children`,
          message: `Child node '${childId}' not found`,
          severity: 'error',
        });
      }
    });
    
    // Valider les sourceIds
    node.sourceIds?.forEach((sourceId: string) => {
      if (!dataSourceIds.has(sourceId)) {
        errors.push({
          code: 'INVALID_SOURCE_REFERENCE',
          path: `pivotProject.nodes.${nodeId}.sourceIds`,
          message: `DataSource '${sourceId}' not found`,
          severity: 'warning', // Warning car le Node peut être manuel
        });
      }
    });
  });
  
  // Valider les Views
  project.views?.forEach((view: any, viewIndex: number) => {
    // Valider les dimensions
    [...(view.rowDimensions || []), ...(view.columnDimensions || [])].forEach((dimId: string) => {
      if (!dimensionIds.has(dimId)) {
        errors.push({
          code: 'INVALID_DIMENSION_REFERENCE',
          path: `pivotProject.views[${viewIndex}].rowDimensions or columnDimensions`,
          message: `Dimension '${dimId}' not found`,
          severity: 'error',
        });
      }
    });
    
    // Valider les filterDimensions
    view.filterDimensions?.forEach((fd: any, fdIndex: number) => {
      if (!dimensionIds.has(fd.dimensionId)) {
        errors.push({
          code: 'INVALID_DIMENSION_REFERENCE',
          path: `pivotProject.views[${viewIndex}].filterDimensions[${fdIndex}].dimensionId`,
          message: `Dimension '${fd.dimensionId}' not found`,
          severity: 'error',
        });
      }
      
      fd.selectedNodes?.forEach((nodeId: string) => {
        if (!nodeIds.has(nodeId)) {
          errors.push({
            code: 'INVALID_NODE_REFERENCE',
            path: `pivotProject.views[${viewIndex}].filterDimensions[${fdIndex}].selectedNodes`,
            message: `Node '${nodeId}' not found`,
            severity: 'error',
          });
        }
      });
    });
    
    // Valider les mesures
    view.measures?.forEach((measure: any, mIndex: number) => {
      if (measure.source.type === 'column') {
        if (!dataSourceIds.has(measure.source.dataSourceId)) {
          errors.push({
            code: 'INVALID_DATA_SOURCE_REFERENCE',
            path: `pivotProject.views[${viewIndex}].measures[${mIndex}].source.dataSourceId`,
            message: `DataSource '${measure.source.dataSourceId}' not found`,
            severity: 'error',
          });
        }
        
        const ds = project.dataSources?.find((d: any) => d.id === measure.source.dataSourceId);
        if (ds && ds.type === 'local' && measure.source.columnIndex >= ds.columns?.length) {
          errors.push({
            code: 'INVALID_COLUMN_INDEX',
            path: `pivotProject.views[${viewIndex}].measures[${mIndex}].source.columnIndex`,
            message: `Column index ${measure.source.columnIndex} out of range`,
            severity: 'error',
          });
        }
      }
    });
  });
  
  return errors;
}

/**
 * Valider les contraintes métier
 */
function validateConstraints(project: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Valider l'unicité des codes de Node dans chaque dimension
  const codesByDimension: Record<string, Set<string>> = {};
  Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
    if (!codesByDimension[node.dimensionId]) {
      codesByDimension[node.dimensionId] = new Set();
    }
    
    if (codesByDimension[node.dimensionId].has(node.code)) {
      errors.push({
        code: 'DUPLICATE_NODE_CODE',
        path: `pivotProject.nodes.${nodeId}.code`,
        message: `Duplicate node code '${node.code}' in dimension '${node.dimensionId}'`,
        severity: 'error',
      });
    }
    codesByDimension[node.dimensionId].add(node.code);
  });
  
  // Valider les types de données des Nodes
  project.dimensions?.forEach((dim: any, dimIndex: number) => {
    Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
      if (node.dimensionId === dim.id) {
        const expectedType = dim.dataType;
        const actualType = typeof node.value;
        
        // Gérer les Dates
        if (node.value instanceof Date) {
          if (expectedType !== 'date') {
            errors.push({
              code: 'TYPE_MISMATCH',
              path: `pivotProject.nodes.${nodeId}.value`,
              message: `Node value is Date but dimension expects '${expectedType}'`,
              severity: 'warning',
            });
          }
        } else if (actualType !== expectedType) {
          // Gérer les cas spéciaux
          if (!(expectedType === 'number' && actualType === 'string' && !isNaN(Number(node.value)))) {
            errors.push({
              code: 'TYPE_MISMATCH',
              path: `pivotProject.nodes.${nodeId}.value`,
              message: `Node value type '${actualType}' doesn't match dimension type '${expectedType}'`,
              severity: 'warning',
            });
          }
        }
      }
    });
  });
  
  // Détecter les références circulaires dans les Nodes
  // (À implémenter si nécessaire)
  
  return errors;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Sauvegarder un projet dans un fichier
 */
export async function saveProjectToFile(project: PivotProject, filePath: string): Promise<void> {
  const json = serializePivotProject(project);
  // Utiliser l'API du navigateur ou Node.js selon l'environnement
  // Pour Node.js:
  // await fs.promises.writeFile(filePath, json, 'utf-8');
  
  // Pour le navigateur (téléchargement):
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filePath || `${project.name || 'pivot-project'}.pivot.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Charger un projet depuis un fichier
 */
export async function loadProjectFromFile(file: File): Promise<DeserializationResult> {
  const text = await file.text();
  return deserializePivotProject(text);
}

/**
 * Charger un projet depuis une URL (pour les fichiers locaux dans le navigateur)
 */
export async function loadProjectFromUrl(url: string): Promise<DeserializationResult> {
  const response = await fetch(url);
  const text = await response.text();
  return deserializePivotProject(text);
}
```

**Statut**: ⏳ À faire
**Priorité**: Haute
**Fichier**: `/src/models/pivot-project/serialization.ts`

---

## 5. ✅ Validation et tests

### 5.1. Créer des tests pour les nouvelles interfaces

**Nouveau fichier** : `/src/models/pivot-project/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type {
  PivotProject,
  LocalDataSource,
  LazyDataSource,
  Dimension,
  Node,
  View,
} from './types';

describe('PivotProject Types', () => {
  it('should have all required fields', () => {
    const project: PivotProject = {
      id: 'test',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataSources: [],
      dimensions: [],
      nodes: {},
      views: [],
    };
    
    expect(project.id).toBeDefined();
    expect(project.name).toBeDefined();
    expect(project.createdAt).toBeDefined();
    expect(project.updatedAt).toBeDefined();
    expect(Array.isArray(project.dataSources)).toBe(true);
    expect(Array.isArray(project.dimensions)).toBe(true);
    expect(typeof project.nodes).toBe('object');
    expect(Array.isArray(project.views)).toBe(true);
  });
  
  it('should support LocalDataSource', () => {
    const ds: LocalDataSource = {
      id: 'ds-1',
      name: 'Test Data',
      type: 'local',
      originalFormat: 'csv',
      loadedAt: new Date().toISOString(),
      columns: [],
      data: [],
    };
    
    expect(ds.type).toBe('local');
    expect(ds.data).toEqual([]);
  });
  
  it('should support LazyDataSource', () => {
    const ds: LazyDataSource = {
      id: 'ds-2',
      name: 'API Data',
      type: 'lazy',
      apiUrl: 'https://api.example.com',
    };
    
    expect(ds.type).toBe('lazy');
    expect(ds.apiUrl).toBe('https://api.example.com');
  });
  
  // ... plus de tests
});
```

### 5.2. Créer des tests pour la sérialisation

**Nouveau fichier** : `/src/models/pivot-project/serialization.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  serializePivotProject, 
  deserializePivotProject 
} from './serialization';
import type { PivotProject } from './types';

describe('Serialization', () => {
  it('should serialize and deserialize a basic project', () => {
    const project: PivotProject = {
      id: 'project-1',
      name: 'Test Project',
      createdAt: '2024-06-10T10:00:00Z',
      updatedAt: '2024-06-10T14:00:00Z',
      dataSources: [],
      dimensions: [],
      nodes: {},
      views: [],
    };
    
    const json = serializePivotProject(project);
    const parsed = JSON.parse(json);
    
    expect(parsed.version).toBe('1.0');
    expect(parsed.pivotProject.name).toBe('Test Project');
    
    const result = deserializePivotProject(json);
    expect(result.errors).toHaveLength(0);
    expect(result.project?.name).toBe('Test Project');
  });
  
  it('should handle LocalDataSource with data', () => {
    const project: PivotProject = {
      id: 'project-1',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataSources: [
        {
          id: 'ds-1',
          name: 'Sales',
          type: 'local',
          originalFormat: 'csv',
          loadedAt: new Date().toISOString(),
          columns: [
            { index: 0, name: 'id', dataType: 'string', nullable: false, unique: true },
            { index: 1, name: 'product', dataType: 'string', nullable: false, unique: false },
          ],
          data: [['1', 'Widget A'], ['2', 'Widget B']],
        },
      ],
      dimensions: [],
      nodes: {},
      views: [],
    };
    
    const json = serializePivotProject(project);
    const result = deserializePivotProject(json);
    
    expect(result.errors).toHaveLength(0);
    expect(result.project?.dataSources).toHaveLength(1);
    expect(result.project?.dataSources[0].data).toEqual([['1', 'Widget A'], ['2', 'Widget B']]);
  });
  
  it('should handle Nodes with Dates', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const project: PivotProject = {
      id: 'project-1',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataSources: [],
      dimensions: [
        {
          id: 'dim-time',
          name: 'Time',
          dataType: 'date',
          columnMappings: [],
          rootNodes: ['node-1'],
        },
      ],
      nodes: {
        'node-1': {
          id: 'node-1',
          dimensionId: 'dim-time',
          code: '2024-01-01',
          value: date,
          metaData: {},
          children: [],
          sourceIds: [],
        },
      },
      views: [],
    };
    
    const json = serializePivotProject(project);
    const result = deserializePivotProject(json);
    
    expect(result.errors).toHaveLength(0);
    expect(result.project?.nodes['node-1'].value).toBeInstanceOf(Date);
    expect((result.project?.nodes['node-1'].value as Date).toISOString()).toBe(date.toISOString());
  });
  
  it('should detect invalid references', () => {
    const json = JSON.stringify({
      version: '1.0',
      pivotProject: {
        id: 'project-1',
        name: 'Test Project',
        createdAt: '2024-06-10T10:00:00Z',
        updatedAt: '2024-06-10T14:00:00Z',
        dataSources: [],
        dimensions: [
          {
            id: 'dim-1',
            name: 'Test Dim',
            dataType: 'string',
            columnMappings: [
              { dataSourceId: 'nonexistent', columnIndex: 0, level: 0 },
            ],
            rootNodes: [],
          },
        ],
        nodes: {},
        views: [],
      },
    });
    
    const result = deserializePivotProject(json);
    expect(result.project).toBeUndefined();
    expect(result.errors.some(e => e.code === 'INVALID_DATA_SOURCE_REFERENCE')).toBe(true);
  });
  
  it('should detect duplicate node codes', () => {
    const json = JSON.stringify({
      version: '1.0',
      pivotProject: {
        id: 'project-1',
        name: 'Test Project',
        createdAt: '2024-06-10T10:00:00Z',
        updatedAt: '2024-06-10T14:00:00Z',
        dataSources: [],
        dimensions: [
          {
            id: 'dim-1',
            name: 'Test Dim',
            dataType: 'string',
            columnMappings: [],
            rootNodes: ['node-1', 'node-2'],
          },
        ],
        nodes: {
          'node-1': {
            id: 'node-1',
            dimensionId: 'dim-1',
            code: 'SAME_CODE',
            value: 'Value 1',
            metaData: {},
            children: [],
            sourceIds: [],
          },
          'node-2': {
            id: 'node-2',
            dimensionId: 'dim-1',
            code: 'SAME_CODE',
            value: 'Value 2',
            metaData: {},
            children: [],
            sourceIds: [],
          },
        },
        views: [],
      },
    });
    
    const result = deserializePivotProject(json);
    expect(result.project).toBeUndefined();
    expect(result.errors.some(e => e.code === 'DUPLICATE_NODE_CODE')).toBe(true);
  });
});
```

**Statut**: ⏳ À faire
**Priorité**: Moyenne
**Fichiers**: 
- `/src/models/pivot-project/types.test.ts`
- `/src/models/pivot-project/serialization.test.ts`

---

## 6. 🗑️ Nettoyage et suppression de l'ancien code

### 6.1. Identifier le code à supprimer

**Fichiers à supprimer** (après migration) :
- ❌ Supprimer `SourceFile` interface de `/src/store/Store.ts`
- ❌ Supprimer l'ancienne `Dimension` interface de `/src/store/Store.ts`
- ❌ Supprimer `FilterConfig` interface de `/src/store/Store.ts`
- ❌ Supprimer l'ancienne `View` interface de `/src/store/Store.ts`

**Fichiers à mettre à jour** :
- ✅ `/src/store/Store.ts` - Utiliser les nouveaux types
- ✅ `/src/models/types.ts` - Ajouter les exports vers les nouveaux types
- ✅ Tous les composants qui importent les anciens types

### 6.2. Mettre à jour les composants

**Composants à vérifier** :
- `/src/components/pivot-grid/PivotGrid.tsx`
- `/src/components/pivot-grid/PivotGridConfiguration.tsx`
- `/src/screens/main/MainScreen.tsx`
- `/src/screens/axe/AxeScreen.tsx`
- `/src/screens/view-grid/ViewGridScreen.tsx`

**Actions** :
- Remplacer les imports des anciens types par les nouveaux types
- Adapter les props et le state pour utiliser `PivotProject`
- Mettre à jour les références aux anciennes structures

**Statut**: ⏳ À faire (après les étapes précédentes)
**Priorité**: Moyenne

---

## 📊 Résumé des fichiers à créer/modifier

### Fichiers NOUVEAUX à créer :

| Fichier | Description | Priorité |
|---------|-------------|----------|
| `/src/models/pivot-project/types.ts` | Toutes les nouvelles interfaces TypeScript | ⭐⭐⭐ Haute |
| `/src/models/pivot-project/serialization.ts` | Sérialisation/desérialisation JSON | ⭐⭐⭐ Haute |
| `/src/models/pivot-project/migration.ts` | Migration depuis l'ancien modèle | ⭐⭐ Moyenne |
| `/src/models/pivot-project/index.ts` | Exports centralisés | ⭐⭐ Moyenne |
| `/src/models/pivot-project/types.test.ts` | Tests des types | ⭐ Moyenne |
| `/src/models/pivot-project/serialization.test.ts` | Tests de la sérialisation | ⭐ Moyenne |

### Fichiers EXISTANTS à modifier :

| Fichier | Modifications | Priorité |
|---------|---------------|----------|
| `/src/models/types.ts` | Ajouter re-exports vers pivot-project/types | ⭐⭐⭐ Haute |
| `/src/store/Store.ts` | Migration complète vers PivotProject | ⭐⭐⭐ Haute |
| `/src/store/index.ts` | Mettre à jour les exports | ⭐⭐ Moyenne |

### Fichiers à mettre à jour (après le cœur) :

| Fichier | Description | Priorité |
|---------|-------------|----------|
| `/src/components/pivot-grid/*.tsx` | Adapter aux nouveaux types | ⭐ Moyenne |
| `/src/screens/*/*.tsx` | Adapter aux nouveaux types | ⭐ Moyenne |
| `/src/App.tsx` | Adapter à PivotProject | ⭐ Moyenne |

---

## 🎯 Ordre de développement recommandé

1. **Étape 1 - Fondations** (Priorité Haute)
   - ✅ Créer `/src/models/pivot-project/types.ts`
   - ✅ Créer `/src/models/pivot-project/serialization.ts`
   - ✅ Mettre à jour `/src/models/types.ts` (re-exports)
   - ✅ Mettre à jour `/src/store/Store.ts` (structure de base)

2. **Étape 2 - Fonctionnalités de base** (Priorité Haute)
   - ✅ Implémenter la sérialisation/desérialisation
   - ✅ Créer `/src/models/pivot-project/migration.ts`
   - ✅ Créer `/src/models/pivot-project/index.ts`

3. **Étape 3 - Tests** (Priorité Moyenne)
   - ✅ Créer les fichiers de test
   - ✅ Exécuter les tests et corriger les bugs

4. **Étape 4 - Migration** (Priorité Moyenne)
   - ✅ Mettre à jour tous les composants
   - ✅ Tester l'application complète

5. **Étape 5 - Nettoyage** (Priorité Basse)
   - ✅ Supprimer l'ancien code obsolète
   - ✅ Faire un audit final

---

## ⚠️ Points d'attention

### 1. Compatibilité descendante
- Pendant la migration, maintenir une compatibilité avec l'ancien modèle si nécessaire
- Utiliser des adaptateurs si certains composants ne peuvent pas être mis à jour immédiatement

### 2. Performance
- Les Nodes sont stockés dans un objet (dictionary) pour un accès O(1)
- Pour les très grands projets, considérer des optimisations (lazy loading, etc.)

### 3. Gestion des erreurs
- La désérialisation doit être robuste et retourner des erreurs détaillées
- Ne pas planter sur des données malformées

### 4. Validation
- Valider toutes les références entre objets (DataSource → Dimension → Node → View)
- Valider les contraintes métier (unicité des codes, types de données, etc.)

### 5. Dates
- Les Dates sont sérialisées en ISO 8601
- La désérialisation doit reconvertir les strings en objets Date

---

## ✅ Checklist de validation

- [ ] Toutes les interfaces TypeScript sont définies et typées correctement
- [ ] La sérialisation fonctionne pour tous les types (y compris Dates, Nodes hiérarchiques)
- [ ] La désérialisation valide toutes les références
- [ ] La migration depuis l'ancien modèle fonctionne
- [ ] Les tests unitaires passent
- [ ] Le Store utilise les nouveaux types
- [ ] Tous les composants compilent sans erreur
- [ ] L'application fonctionne avec un projet de test
- [ ] La sauvegarde/chargement JSON fonctionne

---

## 📅 Estimation temporelle

| Tâche | Temps estimé |
|-------|---------------|
| Création des types TypeScript | 2-4 heures |
| Implémentation du Store | 4-6 heures |
| Sérialisation/Desérialisation | 4-6 heures |
| Migration de l'ancien code | 2-4 heures |
| Tests unitaires | 2-3 heures |
| Migration des composants | 4-8 heures |
| Tests d'intégration | 2-3 heures |
| **Total** | **20-34 heures** |

---

## 🚀 Prochaines étapes

1. **Commencer par créer `/src/models/pivot-project/types.ts`** - C'est la base de tout
2. **Puis créer `/src/models/pivot-project/serialization.ts`** - Pour la persistance
3. **Mettre à jour le Store** - Cœur de l'application
4. **Créer les tests** - Assurer la qualité
5. **Migrer les composants** - Un par un
6. **Tester l'ensemble** - Validation finale
