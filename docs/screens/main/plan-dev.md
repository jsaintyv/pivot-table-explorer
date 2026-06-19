# Main Screen - Development Plan

## Overview
This document outlines the development plan for realizing the Main Screen of the Pivot Table Explorer application, following the MVC pattern and MobX best practices as demonstrated in ViewStore.

## Current State Analysis
The existing MainScreen has the following issues:
- Store.ts has legacy properties mixed with new PivotProject model
- Store.ts has too many responsibilities (project management, data source management, dimension management, view management)
- MainScreen.tsx doesn't follow the component decomposition pattern (max 100 lines per component)
- Missing features: project name editing, project save/load to IndexedDB, project import/export

## New Models to Create

### 1. Project Metadata Model (NEW)
**Suggested**: Create a dedicated model for project metadata

```typescript
// src/models/pivot-project/ProjectMetadata.ts
interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}
```

**Validation with user**: 
- Should we separate project metadata from PivotProject?
- Do we need version tracking for migration purposes?

### 2. IndexedDB Storage Model (NEW)
**Suggested**: Create models for IndexedDB persistence

```typescript
// src/models/storage/IndexedDBModels.ts
interface StoredProject {
  id: string;
  name: string;
  savedAt: string;
  pivotProject: PivotProject;
}
```

**Validation with user**:
- Is IndexedDB the preferred storage mechanism?
- Should we implement a StorageService abstraction?

## New Services to Create or Complete

### 1. StorageService (NEW)
**Suggested**: Create a service for IndexedDB operations

```typescript
// src/services/StorageService.ts
export class StorageService {
  static async saveProject(name: string, project: PivotProject): Promise<void>
  static async loadProject(name: string): Promise<PivotProject | null>
  static async listProjects(): Promise<StoredProject[]>
  static async deleteProject(name: string): Promise<void>
  static async exportProjectToFile(project: PivotProject, filename: string): Promise<void>
  static async importProjectFromFile(file: File): Promise<PivotProject>
}
```

**Validation with user**:
- Should StorageService be a singleton or static class?
- Do we need error handling strategies for storage failures?

### 2. ProjectService (MODIFY)
**Suggested**: Move project-related operations from Store to a dedicated service

```typescript
// src/services/ProjectService.ts
export class ProjectService {
  static createEmptyProject(name?: string): PivotProject
  static validateProject(project: PivotProject): ValidationError[]
  static cloneProject(project: PivotProject): PivotProject
  static autoGenerateNameFromCSV(filename: string): string
}
```

**Validation with user**:
- Should project creation/validation logic be in a service or in the store?

### 3. ProjectSerializationService (NEW)
**Suggested**: Separate serialization logic

```typescript
// src/services/ProjectSerializationService.ts
export class ProjectSerializationService {
  static serialize(project: PivotProject): string
  static deserialize(json: string): PivotProject
  static validateSerialized(json: string): boolean
}
```

**Validation with user**:
- Do we need JSON schema validation for imported projects?

## New Tests on Services to Create or Complete

### 1. StorageService Tests (NEW)
**Suggested tests**:
- Test saving and loading a project to/from IndexedDB
- Test listing all saved projects
- Test deleting a project
- Test error handling when IndexedDB is not available
- Test export/import with file operations

**Validation with user**:
- Should we use a mock IndexedDB for testing?
- Do we need integration tests with real IndexedDB?

### 2. ProjectService Tests (NEW)
**Suggested tests**:
- Test creating an empty project
- Test project validation with valid/invalid data
- Test project cloning
- Test name auto-generation from CSV filename

**Validation with user**:
- What edge cases should we test for project validation?

### 3. CSV Import Tests (MODIFY)
**Suggested**: Complete existing tests for CSV import
- Test importing CSV with various delimiters
- Test importing CSV with headers/no headers
- Test importing large CSV files
- Test error handling for invalid CSV files

## New Store Methods to Create or Complete

### 1. ProjectStore (NEW) - Separate from Store
**Suggested**: Create a dedicated ProjectStore following ViewStore pattern

```typescript
// src/stores/ProjectStore.ts
export class ProjectStore {
  // State
  public currentProject: PivotProject;
  public projectName: string;
  public isLoading: boolean;
  public error: string | null;
  
  // Actions
  createProject(name?: string): void
  loadProject(project: PivotProject): void
  saveProjectAs(name: string): Promise<void>
  loadSavedProject(name: string): Promise<void>
  exportProject(): Promise<void>
  importProject(file: File): Promise<void>
  updateProjectName(name: string): void
  
  // Computed
  get hasUnsavedChanges(): boolean
  get projectList(): Promise<StoredProject[]>
}
```

**Validation with user**:
- Should we split Store.ts into multiple stores (ProjectStore, DataSourceStore, DimensionStore, ViewStore)?
- ViewStore already exists and is referenced by Store - should we follow this pattern for other domains?

### 2. Store.ts Modifications
**Suggested**: Refactor Store.ts to:
- Remove legacy properties (data, availableFields, rowFields, columnFields, valueFields, aggregation, filters)
- Delegate view-specific operations to ViewStore
- Delegate project-specific operations to new ProjectStore
- Keep only PivotProject state and basic CRUD operations

**New methods needed**:
```typescript
// Project management (delegated to ProjectStore)
getProjectName(): string
setProjectName(name: string): void

// Data source management (keep in Store for now)
importCsv(file: File): void  // Already exists

// Synchronization methods
syncWithViewStore(): void  // Sync legacy props from active view
```

**Validation with user**:
- How should we handle the transition from legacy properties to new model?
- Should we maintain backward compatibility during migration?

## New React Components to Create or Complete

### 1. MainScreen (REFACTOR)
**Location**: `src/screens/main/MainScreen.tsx`
**Max lines**: < 100
**Responsibilities**:
- Render main layout
- Delegate to sub-components
- Handle navigation

**Suggested structure**:
```tsx
const MainScreen = observer(() => {
  // Use stores from React context
  const store = useStore();
  const navigate = useNavigate();
  
  return (
    <main className="main-screen">
      <ProjectHeader />
      <DataSourcesSection />
      <DimensionsSection />
      <ViewsSection />
      <NavigationSection />
    </main>
  );
});
```

### 2. ProjectHeader Component (NEW)
**Location**: `src/screens/main/components/ProjectHeader/ProjectHeader.tsx`
**Responsibilities**:
- Display and edit project name
- New Project button
- Export Project button
- Import Project button
- Save As button
- Load button

**Suggested interface**:
```tsx
interface ProjectHeaderProps {
  onNewProject: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSaveAs: (name: string) => void;
  onLoad: (name: string) => void;
}
```

**Validation with user**:
- Should Save/Load use dialogs or separate screens?

### 3. DataSourcesSection Component (NEW)
**Location**: `src/screens/main/components/DataSourcesSection/DataSourcesSection.tsx`
**Responsibilities**:
- Display list of data sources
- Show delete button for each
- Import CSV button

**Max lines**: < 100 (if it grows, split into DataSourceList and ImportButton sub-components)

**Suggested interface**:
```tsx
interface DataSourcesSectionProps {
  dataSources: DataSource[];
  onImportCSV: (file: File) => void;
  onRemoveDataSource: (id: string) => void;
}
```

### 4. DimensionsSection Component (NEW)
**Location**: `src/screens/main/components/DimensionsSection/DimensionsSection.tsx`
**Responsibilities**:
- Display list of dimensions
- Show data type and source for each
- Edit button (navigates to AxeScreen)
- Delete button
- Create Dimension button

**Max lines**: < 100 (if it grows, split into DimensionList and CreateDimensionButton)

### 5. ViewsSection Component (NEW)
**Location**: `src/screens/main/components/ViewsSection/ViewsSection.tsx`
**Responsibilities**:
- Display list of views
- Show button for each view (loads and navigates to ViewGridScreen)
- Delete button for each view
- Create new view form (input + button)

**Max lines**: < 100 (if it grows, split into ViewList and CreateViewForm)

### 6. NavigationSection Component (NEW)
**Location**: `src/screens/main/components/NavigationSection/NavigationSection.tsx`
**Responsibilities**:
- Configure View Grid button
- Create Dimension button

**Validation with user**:
- Should navigation be a separate section or integrated into other sections?

## Test Requirements for React Components

Each React component should have:
1. Unit tests for rendering
2. Unit tests for user interactions
3. Integration tests with stores

**Suggested test files**:
- `ProjectHeader.test.tsx`
- `DataSourcesSection.test.tsx`
- `DimensionsSection.test.tsx`
- `ViewsSection.test.tsx`
- `NavigationSection.test.tsx`

**Validation with user**:
- What testing framework should we use (Jest, Vitest)?
- Should we test with mocked stores or real stores?

## Store Modifications to Handle React Component Events

### ProjectStore methods needed:
1. `createProject(name?: string): void` - Called by ProjectHeader
2. `updateProjectName(name: string): void` - Called by ProjectHeader
3. `exportProject(): void` - Called by ProjectHeader
4. `importProject(file: File): Promise<void>` - Called by ProjectHeader
5. `saveProjectAs(name: string): Promise<void>` - Called by ProjectHeader
6. `loadSavedProject(name: string): Promise<void>` - Called by ProjectHeader

### Store methods needed (existing, verify they work):
1. `importCsv(file: File): void` - Called by DataSourcesSection
2. `removeDataSource(id: string): void` - Called by DataSourcesSection
3. `removeDimension(id: string): void` - Called by DimensionsSection
4. `addView(name: string): string` - Called by ViewsSection
5. `loadView(id: string): void` - Called by ViewsSection
6. `removeView(id: string): void` - Called by ViewsSection

## Implementation Order

1. **Phase 1**: Create new services (StorageService, ProjectService)
   - Write tests for services
   
2. **Phase 2**: Refactor Store.ts
   - Create ProjectStore
   - Move legacy properties to appropriate stores
   - Maintain backward compatibility
   
3. **Phase 3**: Create React components
   - Create component directory structure
   - Implement each component with < 100 lines
   - Make each a MobX observer
   - Use stores from React context
   
4. **Phase 4**: Create MainScreen
   - Assemble sub-components
   - Handle navigation
   - Ensure all stores are properly connected

5. **Phase 5**: Testing
   - Run `npm run build`
   - Run existing tests
   - Create new tests for new components

## Open Questions for User Validation

1. **Store Architecture**: Should we split Store.ts into multiple domain-specific stores (ProjectStore, DataSourceStore, DimensionStore) following the ViewStore pattern?

2. **IndexedDB**: Is IndexedDB the preferred persistence mechanism, or should we use another approach?

3. **Project Name Auto-generation**: The documentation says project name should auto-generate from CSV filename when empty. Should this be the default behavior?

4. **Dialog Implementation**: For Save As and Load operations, should we use native browser dialogs, custom modal dialogs, or a separate screen?

5. **Error Handling**: How should we handle errors (storage failures, invalid imports, etc.)? Display toasts, modals, or inline messages?

6. **Component Granularity**: The documentation suggests components should be max 100 lines. Should we strictly enforce this, or is it a guideline?

7. **Backward Compatibility**: The existing Store has legacy properties used by old code. Should we maintain these during the refactoring, or can we do a breaking change?

8. **File Structure**: Should we use the pattern `src/screens/main/components/{ComponentName}/` for each component, or is there a preferred structure?

## Next Steps

Please validate the above suggestions and clarify the open questions before we proceed with implementation.
