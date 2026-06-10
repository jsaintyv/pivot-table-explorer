# Serialization

## 1. Overview

The entire **PivotProject** can be serialized to JSON and deserialized from JSON. This enables:
- **Saving** projects to files
- **Loading** projects from files
- **Sharing** projects between users or sessions
- **Versioning** projects over time

## 2. JSON Structure

The complete PivotProject is serialized as a single JSON object with the following structure:

```json
{
  "version": "1.0",
  "pivotProject": {
    "id": "project-1",
    "name": "My Analysis Project",
    "description": "Sales analysis for Q1 2024",
    "createdAt": "2024-06-10T10:00:00Z",
    "updatedAt": "2024-06-10T14:30:00Z",
    "dataSources": [...],
    "dimensions": [...],
    "nodes": {...},
    "views": [...]
  }
}
```

## 3. Format Specification

### 3.1 File Format

- **File Extension**: `.pivot.json` (recommended) or `.json`
- **Encoding**: UTF-8
- **Indentation**: Optional (for human readability)

### 3.2 Versioning

The `version` field at the root level indicates the schema version:

```json
{
  "version": "1.0"
}
```

**Version History**:
| Version | Description | Date |
|---------|-------------|------|
| 1.0 | Initial version | 2024-06-10 |

### 3.3 Date Format

All dates in the JSON are represented as **ISO 8601 strings** in UTC:

```json
{
  "createdAt": "2024-06-10T10:00:00Z",
  "updatedAt": "2024-06-10T14:30:00Z",
  "loadedAt": "2024-06-10T09:15:23Z"
}
```

### 3.4 Identifiers

All IDs (`id` fields) are strings. Recommended formats:
- **DataSource**: `ds-{name}` or `ds-{uuid}`
- **Dimension**: `dim-{name}` or `dim-{uuid}`
- **Node**: `node-{code}` or `node-{uuid}`
- **View**: `view-{name}` or `view-{uuid}`

Example:
```json
{
  "id": "ds-sales-csv",
  "name": "Sales Data"
}
```

## 4. Complete JSON Example

```json
{
  "version": "1.0",
  "pivotProject": {
    "id": "project-sales-2024",
    "name": "Sales Analysis 2024",
    "description": "Quarterly sales analysis by region and product",
    "createdAt": "2024-06-10T10:00:00Z",
    "updatedAt": "2024-06-10T14:30:00Z",
    
    "dataSources": [
      {
        "id": "ds-sales",
        "name": "Sales Data",
        "type": "local",
        "originalFormat": "csv",        
        "loadedAt": "2024-06-10T11:00:00Z",
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
    ],
    
    "dimensions": [
      {
        "id": "dim-region",
        "name": "Region",
        "description": "Geographic regions",
        "dataType": "string",
        "columnMappings": [
          {
            "dataSourceId": "ds-sales",
            "columnIndex": 2,
            "level": 0,
            "name": "Region"
          }
        ],
        "rootNodes": ["node-north", "node-south", "node-east"],
        "nodeSchema": {
          "fields": [
            { "name": "color", "type": "color", "required": false, "defaultValue": "#888888" }
          ]
        }
      },
      {
        "id": "dim-product",
        "name": "Product",
        "description": "Product categories",
        "dataType": "string",
        "columnMappings": [
          {
            "dataSourceId": "ds-sales",
            "columnIndex": 1,
            "level": 0,
            "name": "Product"
          }
        ],
        "rootNodes": ["node-widget-a", "node-widget-b"]
      }
    ],
    
    "nodes": {
      "node-north": {
        "id": "node-north",
        "dimensionId": "dim-region",
        "code": "NORTH",
        "value": "North",
        "metaData": {
          "color": "#4285F4"
        },
        "children": [],
        "sourceIds": ["ds-sales"]
      },
      "node-south": {
        "id": "node-south",
        "dimensionId": "dim-region",
        "code": "SOUTH",
        "value": "South",
        "metaData": {
          "color": "#EA4335"
        },
        "children": [],
        "sourceIds": ["ds-sales"]
      },
      "node-east": {
        "id": "node-east",
        "dimensionId": "dim-region",
        "code": "EAST",
        "value": "East",
        "metaData": {
          "color": "#34A853"
        },
        "children": [],
        "sourceIds": ["ds-sales"]
      },
      "node-widget-a": {
        "id": "node-widget-a",
        "dimensionId": "dim-product",
        "code": "WIDGET-A",
        "value": "Widget A",
        "metaData": {},
        "children": [],
        "sourceIds": ["ds-sales"]
      },
      "node-widget-b": {
        "id": "node-widget-b",
        "dimensionId": "dim-product",
        "code": "WIDGET-B",
        "value": "Widget B",
        "metaData": {},
        "children": [],
        "sourceIds": ["ds-sales"]
      }
    },
    
    "views": [
      {
        "id": "view-sales-summary",
        "name": "Sales Summary",
        "description": "Sales by region and product",
        "rowDimensions": ["dim-region", "dim-product"],
        "columnDimensions": [],
        "measures": [
          {
            "id": "measure-sales",
            "name": "Total Sales",
            "source": {
              "type": "column",
              "dataSourceId": "ds-sales",
              "columnIndex": 3
            },
            "aggregation": "sum",
            "format": "€#,##0.00",
            "visible": true
          }
        ],
        "showTotals": true,
        "showGrandTotal": true,
        "createdAt": "2024-06-10T12:00:00Z",
        "updatedAt": "2024-06-10T14:30:00Z"
      }
    ]
  }
}
```

## 5. Nodes Storage

**Important**: Nodes are stored in a **flat object** (dictionary) with Node IDs as keys:

```json
"nodes": {
  "node-id-1": { ... },
  "node-id-2": { ... },
  "node-id-3": { ... }
}
```

This format:
- Makes it easy to look up Nodes by ID
- Preserves the hierarchy through the `children` field
- Enables efficient serialization/deserialization
- Allows for O(1) Node access

## 6. Type Mapping to JSON

| TypeScript Type | JSON Type | Example |
|-----------------|-----------|---------|
| `string` | string | `"North"` |
| `number` | number | `150` |
| `boolean` | boolean | `true` |
| `Date` | string (ISO 8601) | `"2024-01-01T00:00:00Z"` |
| `null` | null | `null` |
| `undefined` | not present | (field omitted) |

**Note**: `undefined` values are omitted from the JSON, while `null` values are explicitly included.

## 7. Validation

When loading a PivotProject from JSON, the following validations should be performed:

### 7.1 Structural Validation
- [ ] Root has `version` field
- [ ] Root has `pivotProject` field
- [ ] `pivotProject` has all required fields

### 7.2 Reference Integrity
- [ ] All DataSource IDs referenced in `columnMappings` exist
- [ ] All Dimension IDs referenced in Nodes exist
- [ ] All Dimension IDs referenced in Views exist
- [ ] All Node IDs referenced in `children` exist
- [ ] All Node IDs referenced in `rootNodes` exist
- [ ] All DataSource IDs referenced in Views exist
- [ ] All column indices in `columnMappings` are valid for their DataSource
- [ ] All column indices in measure sources are valid for their DataSource

### 7.3 Data Type Validation
- [ ] All Node `value` types match their dimension's `dataType`
- [ ] All MetaData fields conform to their dimension's NodeSchema
- [ ] All dates are valid ISO 8601 strings

### 7.4 Constraint Validation
- [ ] Node `code` values are unique within each dimension
- [ ] No circular references in Node hierarchies
- [ ] No circular references in calculated measure expressions

## 8. Serialization/Deserialization API

```typescript
// Serialization
function serializePivotProject(project: PivotProject): string {
  const wrapper = {
    version: "1.0",
    pivotProject: project
  };
  return JSON.stringify(wrapper, null, 2);
}

// Deserialization
function deserializePivotProject(jsonString: string): { project: PivotProject; errors: ValidationError[] } {
  const wrapper = JSON.parse(jsonString);
  const project = wrapper.pivotProject as PivotProject;
  const errors = validatePivotProject(project);
  return { project, errors };
}

// File operations
function savePivotProject(project: PivotProject, filePath: string): Promise<void> {
  const json = serializePivotProject(project);
  return fs.promises.writeFile(filePath, json, 'utf-8');
}

async function loadPivotProject(filePath: string): Promise<{ project?: PivotProject; errors: ValidationError[] }> {
  const json = await fs.promises.readFile(filePath, 'utf-8');
  return deserializePivotProject(json);
}
```

## 9. Error Handling

Validation errors should be collected and returned, not thrown, to allow for:
- Partial loading of valid data
- User-friendly error messages
- Batch error reporting

```typescript
interface ValidationError {
  code: string; // Error code (e.g., "MISSING_FIELD", "INVALID_REFERENCE")
  path: string; // JSON path to the error (e.g., "pivotProject.dimensions[0].columnMappings[1]")
  message: string; // Human-readable error message
  severity: 'error' | 'warning'; // Error severity
}
```

## 10. Future Considerations

### 10.1 Compression
For large projects, consider:
- GZIP compression before saving
- Binary formats (e.g., MessagePack) as an alternative

### 10.2 Encryption
For sensitive data:
- Encrypt the JSON before saving
- Password protection

### 10.3 Version Migration
When updating the schema:
- Provide migration scripts from old to new versions
- Maintain backward compatibility where possible
- Document breaking changes

### 10.4 Chunked Loading
For very large projects:
- Split into multiple files
- Lazy loading of data
- On-demand fetching of Nodes
