# DataSource Model

## 1. Overview

A **DataSource** represents a source of data in a PivotProject. There are two types of DataSources with different behaviors and structures.

## 2. DataSource Types

### 2.1 LocalDataSource

Represents data that has been **loaded from a CSV or Excel file** and is **embedded directly in the project model**.

**Purpose**: Enable offline analysis with data that's readily available in memory.

**Structure**:
```typescript
interface LocalDataSource {
  id: string;
  name: string;
  type: 'local';
  originalFormat: 'csv' | 'excel';  
  loadedAt: string; // ISO 8601 timestamp
  columns: DataColumn[]; // Metadata about each column
  data: any[][]; // The actual data as array of rows (each row is array of values)
}
```

**Fields**:
- `id`: Unique identifier within the project
- `name`: Human-readable name
- `type`: Discriminator, always `'local'`
- `originalFormat`: Format of the source file
- `loadedAt`: When the data was loaded
- `columns`: Array of column metadata (name, type, etc.)
- `data`: The actual data in row-major format

**Key Point**: The `data` field contains the **complete dataset** transformed into a format easily manipulable in memory.

---

### 2.2 LazyDataSource

Represents data that is **accessible via a JSON-API endpoint** and must be **fetched on demand**.

**Purpose**: Enable analysis of large datasets without loading everything upfront.

**Structure**:
```typescript
interface LazyDataSource {
  id: string;
  name: string;
  type: 'lazy';
  apiUrl: string; // Base URL for the JSON API
  endpoint?: string; // Specific endpoint path
  parameters?: Record<string, any>; // Optional query parameters
  dataSchema?: any; // Optional: schema description for expected data
  // Note: NO embedded data - data is fetched when needed
}
```

**Fields**:
- `id`: Unique identifier within the project
- `name`: Human-readable name
- `type`: Discriminator, always `'lazy'`
- `apiUrl`: Base URL for the API
- `endpoint`: Specific endpoint to query (appended to apiUrl)
- `parameters`: Optional query parameters for the API call
- `dataSchema`: Optional schema description (for validation/understanding)

**Key Point**: There is **NO `data` field** - the data must be fetched from the API when needed.

---

## 3. Common Fields

Both DataSource types share:
- `id`: string (required, unique)
- `name`: string (required)
- `type`: 'local' | 'lazy' (required, discriminator)

---

## 4. DataColumn

Column metadata for LocalDataSources (and optionally for understanding LazyDataSources):

```typescript
interface DataColumn {
  index: number; // Column index (0-based)
  name: string; // Column name/heading
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  nullable: boolean; // Whether the column can contain null values
  unique: boolean; // Whether values in this column are unique
}
```

---

## 5. Union Type

```typescript
type DataSource = LocalDataSource | LazyDataSource;
```

---

## 6. Example

### LocalDataSource Example (from CSV):
```json
{
  "id": "ds-sales-csv",
  "name": "Sales Data 2024",
  "type": "local",
  "originalFormat": "csv",  
  "loadedAt": "2024-06-10T14:30:00Z",
  "columns": [
    {"index": 0, "name": "id", "dataType": "string", "nullable": false, "unique": true},
    {"index": 1, "name": "product", "dataType": "string", "nullable": false, "unique": false},
    {"index": 2, "name": "region", "dataType": "string", "nullable": false, "unique": false},
    {"index": 3, "name": "sales", "dataType": "number", "nullable": false, "unique": false},
    {"index": 4, "name": "date", "dataType": "date", "nullable": false, "unique": false}
  ],
  "data": [
    ["s1", "Widget A", "North", 150, "2024-01-01"],
    ["s2", "Widget B", "South", 200, "2024-01-02"],
    ["s3", "Widget A", "East", 175, "2024-01-03"]
  ]
}
```

### LazyDataSource Example:
```json
{
  "id": "ds-inventory-api",
  "name": "Inventory Service",
  "type": "lazy",
  "apiUrl": "https://api.example.com/v1",
  "endpoint": "/inventory",
  "parameters": {
    "include": "details",
    "limit": 1000
  }
}
```

---

## 7. Important Notes

1. **No Authentication**: For now, LazyDataSources do NOT handle authentication. This may be added in the future.

2. **No Incremental Loading**: DataSources are loaded in their entirety. There is no support for incremental or partial loading.

3. **CSV/Excel Transformation**: When loading from CSV or Excel, the data is **transformed** into the `data` array format which is optimized for in-memory manipulation and cross-tabulation operations.

4. **Data Access**: 
   - LocalDataSource: Data is immediately available in the `data` field
   - LazyDataSource: Data must be fetched via API call when needed

5. **Column Mapping**: The `columns` array in LocalDataSource provides metadata that helps when defining Dimensions (mapping columns to dimension levels).
