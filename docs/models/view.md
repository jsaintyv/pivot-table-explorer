# View Model

## 1. Overview

A **View** represents a specific pivot table configuration within a PivotProject. It defines how data should be organized, aggregated, and displayed in a cross-tabulation format.

## 2. Purpose

Views are where the actual **calculations** and **aggregations** happen. While Dimensions and Nodes define the structure of the data, Views define how that data is presented and analyzed.

## 3. Key Characteristics

- **Multiple per Project**: A PivotProject can contain **one or more Views**
- **Configurable Axes**: Defines which dimensions are used for rows, columns, and filters
- **Aggregations**: Specifies how data values are aggregated (sum, average, count, etc.)
- **Calculations**: Contains calculated fields and derived metrics
- **Display Settings**: Controls formatting, sorting, and visualization options

## 4. Structure

```typescript
interface View {
  id: string; // Unique identifier
  name: string; // Human-readable name
  description?: string; // Optional description
  
  // Axes configuration
  rowDimensions: string[]; // Dimension IDs for row axis
  columnDimensions: string[]; // Dimension IDs for column axis
  filterDimensions?: FilterDimension[]; // Optional: dimensions used for filtering
  
  // Data configuration
  measures: Measure[]; // Metrics to display
  
  // Display settings
  showTotals: boolean; // Show row/column totals
  showGrandTotal: boolean; // Show grand total
  sortOrder?: SortConfig[]; // Sorting configuration
  formatOptions?: FormatOptions; // Number/date formatting
  
  // State
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

## 5. Axes Configuration

### 5.1 Row Dimensions
Array of Dimension IDs that will be used for the **row axis** of the pivot table.

**Example**: `["dim-region", "dim-product"]` will create a row hierarchy of Region → Product.

### 5.2 Column Dimensions
Array of Dimension IDs that will be used for the **column axis** of the pivot table.

**Example**: `["dim-time"]` will create columns for each time period.

### 5.3 Filter Dimensions
Optional array of dimensions with selected values to filter the data:

```typescript
interface FilterDimension {
  dimensionId: string;
  selectedNodes: string[]; // Array of Node IDs to include
  operator: 'include' | 'exclude'; // Include or exclude selected nodes
}
```

**Example**: Filter to only show data for Europe and North America:
```json
{
  "dimensionId": "dim-region",
  "selectedNodes": ["node-europe", "node-north-america"],
  "operator": "include"
}
```

## 6. Measures

Measures define the **numeric values** to display in the pivot table cells:

```typescript
interface Measure {
  id: string; // Unique identifier within the view
  name: string; // Display name
  source: MeasureSource; // Where the data comes from
  aggregation: AggregationType; // How to aggregate
  format?: string; // Format string (e.g., "€#,##0.00", "0.00%")
  visible: boolean; // Whether to show this measure
}

type MeasureSource = 
  | { type: 'column'; dataSourceId: string; columnIndex: number }
  | { type: 'calculated'; expression: string };

type AggregationType = 
  | 'sum'
  | 'average'
  | 'count'
  | 'min'
  | 'max'
  | 'first'
  | 'last';
```

### 6.1 Column-Based Measures
Data comes directly from a DataSource column:

```json
{
  "id": "measure-sales",
  "name": "Sales",
  "source": {
    "type": "column",
    "dataSourceId": "ds-sales",
    "columnIndex": 3
  },
  "aggregation": "sum",
  "format": "€#,##0.00"
}
```

### 6.2 Calculated Measures
Data is computed from an expression:

```json
{
  "id": "measure-margin",
  "name": "Margin %",
  "source": {
    "type": "calculated",
    "expression": "([Sales] - [Cost]) / [Sales] * 100"
  },
  "aggregation": "average",
  "format": "0.00%"
}
```

**Note**: Calculations are performed **within the View**, not in Dimensions or Nodes.

## 7. Display Settings

### 7.1 Sort Configuration

```typescript
interface SortConfig {
  dimensionId: string; // Which dimension to sort
  direction: 'asc' | 'desc'; // Sort direction
  mode: 'byValue' | 'byCode' | 'byName' | 'custom'; // Sort by what
  measureId?: string; // For sorting by measure value
}
```

### 7.2 Format Options

```typescript
interface FormatOptions {
  numberFormat?: string; // Default number format
  dateFormat?: string; // Default date format
  showZeros?: boolean; // Show zero values
  showNulls?: boolean; // Show null values
  decimalSeparator?: string; // "." or ","
  thousandSeparator?: string; // "," or "." or " "
}
```

## 8. Example

```json
{
  "id": "view-sales-by-region-product",
  "name": "Sales by Region and Product",
  "description": "Monthly sales breakdown by region and product category",
  
  "rowDimensions": ["dim-region", "dim-product"],
  "columnDimensions": ["dim-time"],
  "filterDimensions": [
    {
      "dimensionId": "dim-region",
      "selectedNodes": ["node-europe", "node-north-america"],
      "operator": "include"
    }
  ],
  
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
    },
    {
      "id": "measure-units",
      "name": "Units Sold",
      "source": {
        "type": "column",
        "dataSourceId": "ds-sales",
        "columnIndex": 4
      },
      "aggregation": "sum",
      "format": "#,##0",
      "visible": true
    },
    {
      "id": "measure-avg-price",
      "name": "Average Price",
      "source": {
        "type": "calculated",
        "expression": "[Total Sales] / [Units Sold]"
      },
      "aggregation": "average",
      "format": "€#,##0.00",
      "visible": true
    }
  ],
  
  "showTotals": true,
  "showGrandTotal": true,
  "sortOrder": [
    {
      "dimensionId": "dim-region",
      "direction": "asc",
      "mode": "byCode"
    }
  ],
  "formatOptions": {
    "numberFormat": "#,##0.00",
    "dateFormat": "MMM YYYY",
    "showZeros": true,
    "decimalSeparator": ".",
    "thousandSeparator": ","
  },
  
  "createdAt": "2024-06-10T10:00:00Z",
  "updatedAt": "2024-06-10T14:30:00Z"
}
```

## 9. Data Flow

When a View is rendered:

1. **Data Collection**: Gather data from all DataSources referenced in measures
2. **Filtering**: Apply filter dimensions to reduce the dataset
3. **Grouping**: Group data by row and column dimensions
4. **Aggregation**: Calculate measure values for each cell using specified aggregations
5. **Calculation**: Compute calculated measures based on their expressions
6. **Formatting**: Apply formatting options to all values
7. **Display**: Render the pivot table with proper hierarchy and totals

## 10. Hierarchical Display

When multiple dimensions are used on an axis, the View automatically creates a **hierarchy**:

**Example** with `rowDimensions: ["dim-region", "dim-product"]`:

```
Europe (Region)
├── Widget A (Product) - Total Sales: €15,000
│   ├── Small (Size) - Total Sales: €5,000
│   └── Large (Size) - Total Sales: €10,000
└── Widget B (Product) - Total Sales: €20,000
    ├── Small (Size) - Total Sales: €8,000
    └── Large (Size) - Total Sales: €12,000

North America (Region)
├── Widget A (Product) - Total Sales: €12,000
└── Widget B (Product) - Total Sales: €18,000
```

## 11. Totals

- **Row Totals**: Sum/aggregate across columns for each row
- **Column Totals**: Sum/aggregate across rows for each column
- **Grand Total**: Total of all values in the table

The `showTotals` and `showGrandTotal` flags control whether these are displayed.

## 12. Important Notes

1. **Measure References**: Calculated measures can reference other measures using their IDs in expressions (e.g., `[Sales]` references the measure with id "measure-sales")

2. **Aggregation Context**: Aggregations are performed within the context of each cell (intersection of row and column dimensions)

3. **Multi-Source**: A View can reference data from multiple DataSources. The system must handle joining/merging data appropriately.

4. **Performance**: Complex Views with many dimensions, measures, and large datasets may require optimization for performance.

5. **Validation**: The View configuration must be validated to ensure:
   - All referenced dimensions exist
   - All referenced DataSources exist
   - All referenced columns exist in their DataSources
   - Circular references in calculated measures are prevented
