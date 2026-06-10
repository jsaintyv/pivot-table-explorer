# PivotProject Model Overview

## 1. Introduction

The **PivotProject** is the root model for data analysis projects. It serves as a container for data sources, dimensions, nodes, and views that enable users to create dynamic data cross-tabulations (pivot tables).

## 2. Core Concepts

### 2.1 PivotProject
The main container object that holds all project components.

**Purpose**: Organize and manage all resources needed for data analysis including sources, dimensions, and views.

### 2.2 DataSource
Represents a source of data that can be either:
- **Local**: Data already loaded from CSV or Excel files (data is embedded in the model)
- **Lazy**: Data accessible via JSON-API (data is fetched on demand)

### 2.3 Dimension
A logical grouping of related data values that can be used as axes in pivot tables.

**Key Characteristics**:
- Can span multiple data sources
- Defined by one or more columns from source data
- Each column defines a hierarchy level (depth)
- Has a specific data type: `string`, `number`, `date`, or `boolean`

### 2.4 Node
Represents a specific value within a dimension.

**Key Characteristics**:
- Belongs to exactly one dimension
- Has a unique code within its dimension (no duplicates)
- Can have typed metadata
- Can have children nodes (forming hierarchies)
- Can originate from multiple data sources

### 2.5 MetaData
Additional typed information attached to nodes.

**Characteristics**:
- Schema-defined (typed fields)
- Extensible per dimension
- Used for styling, filtering, or additional business logic

### 2.6 View
Represents a specific pivot table configuration (cross-tabulation).

**Purpose**: Define how data should be aggregated and displayed.

**Note**: Calculations and aggregations are performed within Views.

## 3. Relationships

```
PivotProject
├── dataSources[ ]
│   ├── LocalDataSource (contains embedded data)
│   └── LazyDataSource (references external API)
│
├── dimensions[ ]
│   └── Dimension
│       ├── columnMappings[ ] (links to DataSource columns)
│       └── rootNodes[ ] (entry points to Node tree)
│
├── nodes[ ]
│   └── Node
│       ├── metaData: MetaData
│       └── children[ ] (hierarchy)
│
└── views[ ]
    └── View (contains pivot configuration and calculations)
```

## 4. Serialization

The entire PivotProject can be:
- **Saved** to a JSON file
- **Loaded** from a JSON file

This enables project persistence and sharing between users/sessions.

## 5. Usage Flow

1. Create a new PivotProject
2. Add DataSources (local or lazy)
3. Define Dimensions by mapping columns from DataSources
4. Nodes are automatically extracted or manually defined
5. Create Views to define cross-tabulations
6. Save/Load the entire project as JSON

## 6. Key Constraints

- Node codes are **unique within a dimension**
- A dimension can be **used across multiple DataSources**
- Nodes can **originate from multiple DataSources**
- MetaData fields are **typed** (not free-form)
- Calculations happen in **Views**, not in Dimensions or Nodes
- Local DataSources contain **embedded data** (transformed from CSV/Excel)
- Lazy DataSources contain **connection information only**
