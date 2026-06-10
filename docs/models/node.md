# Node Model

## 1. Overview

A **Node** represents a specific value within a Dimension. Nodes are the building blocks of hierarchies and are used to organize and categorize data in pivot tables.

## 2. Key Characteristics

- **Unique Code**: Each Node has a **unique code within its dimension**
- **Hierarchical**: Can have **child Nodes** forming a tree structure
- **Multi-Source**: Can **originate from multiple DataSources**
- **Typed MetaData**: Contains **typed additional information** defined by the dimension's NodeSchema
- **Value**: Has a **value** compatible with its dimension's data type

## 3. Structure

```typescript
interface Node {
  id: string; // Unique identifier (global within the project)
  dimensionId: string; // ID of the dimension this node belongs to
  code: string; // Unique code within the dimension
  value: string | number | Date | boolean; // The actual value of this node
  metaData: MetaData; // Typed metadata as defined by dimension's NodeSchema
  children: string[]; // IDs of child nodes (empty array if leaf)
  sourceIds: string[]; // IDs of DataSources this node originates from
}
```

## 4. Fields

### 4.1 id
- **Type**: `string`
- **Required**: Yes
- **Description**: Globally unique identifier within the PivotProject
- **Format**: Typically generated as `node-{uuid}` or similar

### 4.2 dimensionId
- **Type**: `string`
- **Required**: Yes
- **Description**: References the Dimension this Node belongs to
- **Constraint**: Must exist in the project's dimensions

### 4.3 code
- **Type**: `string`
- **Required**: Yes
- **Description**: Unique identifier within the dimension
- **Constraint**: **Must be unique within the dimension** (across all DataSources)
- **Purpose**: Used for lookups, references, and ensuring uniqueness

### 4.4 value
- **Type**: `string | number | Date | boolean`
- **Required**: Yes
- **Description**: The actual value displayed for this Node
- **Constraint**: Must match the data type of its dimension
- **Example**: "France", 2024, true, new Date("2024-01-01")

### 4.5 metaData
- **Type**: `MetaData` (see below)
- **Required**: Yes (can be empty object)
- **Description**: Additional typed information attached to this Node
- **Constraint**: Must conform to the dimension's NodeSchema (if defined)

### 4.6 children
- **Type**: `string[]`
- **Required**: Yes
- **Description**: Array of Node IDs that are direct children of this Node
- **Constraint**: Children must belong to the same dimension
- **Note**: Empty array means this is a leaf node

### 4.7 sourceIds
- **Type**: `string[]`
- **Required**: Yes
- **Description**: Array of DataSource IDs from which this Node originates
- **Purpose**: Tracks which DataSources contributed data to this Node
- **Constraint**: All listed DataSources must exist in the project

## 5. MetaData Structure

MetaData contains typed fields as defined by the dimension's NodeSchema:

```typescript
type MetaData = Record<string, string | number | boolean | Date | string>;
```

**Example**:
```typescript
{
  color: "#FF5733",
  description: "North region including France and Germany",
  isActive: true,
  sortOrder: 1
}
```

**Important**: 
- All MetaData fields must be **typed** (not free-form)
- The available fields and their types are defined by the dimension's `NodeSchema`
- Fields not in the schema may be ignored or cause validation errors

## 6. Hierarchy

Nodes form hierarchical trees:

- Each Node can have **0 or more children** (stored as array of Node IDs)
- Children **must belong to the same dimension** as their parent
- The hierarchy depth is determined by the dimension's `columnMappings`
- A Node's position in the hierarchy corresponds to its level in the column mapping

**Example Hierarchy**:
```
World (level 0)
├── Europe (level 1)
│   ├── France (level 2)
│   │   ├── Paris (level 3)
│   │   └── Lyon (level 3)
│   └── Germany (level 2)
│       ├── Berlin (level 3)
│       └── Munich (level 3)
└── Asia (level 1)
    ├── China (level 2)
    └── Japan (level 2)
```

## 7. Multi-Source Support

A Node can originate from multiple DataSources:

- The `sourceIds` array tracks all DataSources that contributed to this Node
- This enables tracking data provenance
- When merging Nodes from different sources, the system must ensure:
  - Same `code` within the dimension
  - Same or compatible `value`
  - Merged `metaData` (with conflict resolution)
  - Combined `sourceIds`

**Example**:
```json
{
  "id": "node-europe",
  "dimensionId": "dim-region",
  "code": "EU",
  "value": "Europe",
  "metaData": {
    "color": "#4285F4",
    "description": "European continent"
  },
  "children": ["node-france", "node-germany", "node-uk"],
  "sourceIds": ["ds-sales-csv", "ds-inventory-excel"]
}
```

This Node exists in both the sales CSV and inventory Excel DataSources.

## 8. Node Creation

Nodes can be created in several ways:

1. **Automatic Extraction**: When importing a DataSource, Nodes are automatically extracted from columns mapped to dimensions
2. **Manual Creation**: Users can manually create Nodes (e.g., for calculated categories)
3. **Merging**: Nodes from different DataSources are merged if they have the same code

**Automatic Extraction Process**:
1. For each dimension with column mappings to this DataSource
2. For each row in the DataSource
3. Extract values from mapped columns at each level
4. Create or update Nodes with these values
5. Build the hierarchy based on column mapping levels

## 9. Example

```json
{
  "id": "node-2024-q1",
  "dimensionId": "dim-time",
  "code": "2024-Q1",
  "value": "Q1 2024",
  "metaData": {
    "color": "#34A853",
    "quarterNumber": 1,
    "isCurrent": false
  },
  "children": ["node-2024-01", "node-2024-02", "node-2024-03"],
  "sourceIds": ["ds-sales-csv"]
}
```

## 10. Important Constraints

1. **Unique Code**: Within a dimension, the `code` field must be unique. No two Nodes in the same dimension can have the same code, regardless of their source.

2. **Type Consistency**: The `value` must match the data type of the dimension (string, number, date, or boolean).

3. **Same Dimension**: All children of a Node must belong to the same dimension.

4. **MetaData Validation**: MetaData must conform to the dimension's NodeSchema. Required fields must be present, and field types must match.

5. **Source Tracking**: The `sourceIds` array must accurately reflect all DataSources that contributed data to this Node.

6. **Hierarchy Level**: The depth of a Node in the hierarchy (distance from root) must correspond to the level defined in the dimension's column mappings.

## 11. Usage in Pivot Tables

Nodes are used as:
- **Row headers** in pivot tables
- **Column headers** in pivot tables
- **Filter values** for data selection
- **Grouping criteria** for aggregations

The hierarchy allows for drill-down analysis (e.g., Year → Quarter → Month).
