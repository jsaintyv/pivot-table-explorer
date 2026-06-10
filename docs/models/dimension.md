# Dimension Model

## 1. Overview

A **Dimension** represents a logical axis or category that can be used to organize and analyze data in pivot tables. Dimensions group related values (Nodes) that share a common semantic meaning.

## 2. Key Characteristics

- **Cross-Source**: A dimension can be **used across multiple DataSources**
- **Multi-Column**: Defined by **one or more columns** from DataSources
- **Hierarchical**: Columns define **hierarchy levels** (depth)
- **Typed**: Has a specific **data type** (string, number, date, or boolean)
- **Unique Codes**: Each Node within a dimension has a **unique code**

## 3. Structure

```typescript
interface Dimension {
  id: string; // Unique identifier
  name: string; // Human-readable name
  description?: string; // Optional description
  dataType: 'string' | 'number' | 'date' | 'boolean'; // Type of values in this dimension
  columnMappings: ColumnMapping[]; // Links to DataSource columns
  rootNodes: string[]; // IDs of root nodes in this dimension's hierarchy
  nodeSchema?: NodeSchema; // Optional: schema for Node metadata
}
```

## 4. ColumnMapping

Defines how a dimension is mapped to columns in DataSources:

```typescript
interface ColumnMapping {
  dataSourceId: string; // ID of the DataSource
  columnIndex: number; // Index of the column in that DataSource
  level: number; // Depth level in the hierarchy (0 = root, 1 = child, etc.)
  name?: string; // Optional: custom name for this level
}
```

**Example**: A "Location" dimension might be defined by:
- Level 0 (root): Country column
- Level 1: Region column  
- Level 2: City column

## 5. NodeSchema

Defines the structure of MetaData for Nodes in this dimension:

```typescript
interface NodeSchema {
  fields: SchemaField[];
}

interface SchemaField {
  name: string; // Field name
  type: 'string' | 'number' | 'boolean' | 'color' | 'date';
  required: boolean; // Whether this field is mandatory
  defaultValue?: any; // Default value if not provided
}
```

**Example NodeSchema**:
```typescript
{
  fields: [
    { name: "color", type: "color", required: false, defaultValue: "#CCCCCC" },
    { name: "description", type: "string", required: false },
    { name: "isActive", type: "boolean", required: false, defaultValue: true },
    { name: "sortOrder", type: "number", required: false, defaultValue: 0 }
  ]
}
```

## 6. Hierarchy

Dimensions support hierarchical organization through the `columnMappings`:

- Each `ColumnMapping` defines a level in the hierarchy
- Level 0 = root level (top of hierarchy)
- Level 1 = first level of children
- Level N = deeper nesting

**Example**: For a "Time" dimension:
```typescript
columnMappings: [
  { dataSourceId: "ds-1", columnIndex: 5, level: 0, name: "Year" },
  { dataSourceId: "ds-1", columnIndex: 6, level: 1, name: "Quarter" },
  { dataSourceId: "ds-1", columnIndex: 7, level: 2, name: "Month" },
  { dataSourceId: "ds-2", columnIndex: 3, level: 0, name: "Year" }, // Same dimension from different source
  { dataSourceId: "ds-2", columnIndex: 4, level: 1, name: "Quarter" }
]
```

## 7. Multi-Source Support

A dimension can span multiple DataSources:

- The same dimension (e.g., "Product") can be defined in multiple DataSources
- Each DataSource contributes its own column mappings
- Nodes from different sources are merged into the same dimension hierarchy
- Node codes must remain **unique within the dimension** across all sources

## 8. Data Type

The `dataType` field defines the type of values in this dimension:

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | "North", "Product A", "Q1" |
| `number` | Numeric values | 2024, 1, 100 |
| `date` | Date values | "2024-01-01", "2024-Q1" |
| `boolean` | Boolean values | true, false |

**Important**: All Nodes in a dimension must have values compatible with this type.

## 9. Root Nodes

The `rootNodes` array contains the IDs of the top-level Nodes in this dimension's hierarchy. These are the entry points to traverse the dimension's Node tree.

## 10. Example

```json
{
  "id": "dim-geometry",
  "name": "Geometry",
  "description": "Product geometry classification",
  "dataType": "string",
  "columnMappings": [
    {
      "dataSourceId": "ds-sales",
      "columnIndex": 2,
      "level": 0,
      "name": "Geometry Type"
    },
    {
      "dataSourceId": "ds-sales",
      "columnIndex": 3,
      "level": 1,
      "name": "Geometry Subtype"
    },
    {
      "dataSourceId": "ds-inventory",
      "columnIndex": 5,
      "level": 0,
      "name": "Geometry Type"
    }
  ],
  "rootNodes": ["node-geometry-solid", "node-geometry-hollow"],
  "nodeSchema": {
    "fields": [
      { "name": "color", "type": "color", "required": false, "defaultValue": "#888888" },
      { "name": "icon", "type": "string", "required": false },
      { "name": "isStandard", "type": "boolean", "required": false, "defaultValue": true }
    ]
  }
}
```

## 11. Important Constraints

1. **Unique Node Codes**: Within a dimension, each Node must have a unique `code` field. No duplicates are allowed, even if Nodes come from different DataSources.

2. **Consistent Data Type**: All Nodes in a dimension must have values that match the dimension's `dataType`.

3. **Hierarchy Integrity**: If a Node has children, those children must be at the next hierarchy level (level + 1) as defined in the column mappings.

4. **Column Mapping**: When importing data, the system uses `columnMappings` to extract values and create/identify Nodes at the appropriate hierarchy level.

5. **Cross-Source Merging**: When the same dimension is mapped from multiple DataSources, the system must merge Nodes while ensuring code uniqueness.
