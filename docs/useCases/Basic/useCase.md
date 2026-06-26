# Use Case: Basic Pivot Grid with Hierarchical Headers

## Overview

This use case describes the expected behavior and rendering output for a basic pivot grid with hierarchical headers. It serves as a reference for implementing and testing the hierarchical header functionality in the PivotGridTable component.

## Input Data

### CSV Source Data

```csv
"Customer";"Year";"Month";"Product";"Recalled";"Sold"
"Shop A";2025;1;"Tool A";3;5
"Shop B";2025;3;"Tool A";43;320
"Shop A";2025;1;"Tool B";20;15
"Shop B";2025;3;"Tool B";43;302
"Shop A";2025;2;"Tool C";4;303
"Shop B";2025;1;"Tool C";41;500
"Shop A";2024;1;"Tool A";3;5
"Shop B";2024;3;"Tool A";43;320
"Shop A";2024;1;"Tool B";20;15
"Shop B";2024;3;"Tool B";43;302
"Shop A";2024;2;"Tool C";4;303
"Shop B";2024;1;"Tool C";41;500
```

**Data Characteristics:**
- 12 data rows
- 6 columns: Customer, Year, Month, Product, Recalled, Sold
- 2 unique customers: Shop A, Shop B
- 2 unique years: 2024, 2025
- 3 unique months: 1, 2, 3
- 3 unique products: Tool A, Tool B, Tool C
- 2 measures: Recalled, Sold

## View Configuration

### View: Test

```
Rows: Customer; Product;
Columns: Year; Month;
Measures: Recalled; Sold
```

**Configuration Details:**
- **Row Dimensions**: Customer → Product (2 levels)
- **Column Dimensions**: Year → Month (2 levels)
- **Measures**: Recalled, Sold
- **Cell Dimensions**: CELL_WIDTH = 120px, CELL_HEIGHT = 40px

## Expected Hierarchy Structures

### Row Hierarchy (Customer → Product)

```
Customer (Level 0)
├── Shop A (key: "Shop A", spans 3 products)
│   ├── Tool A (key: "Shop A;Tool A", leaf)
│   ├── Tool B (key: "Shop A;Tool B", leaf)
│   └── Tool C (key: "Shop A;Tool C", leaf)
└── Shop B (key: "Shop B", spans 3 products)
    ├── Tool A (key: "Shop B;Tool A", leaf)
    ├── Tool B (key: "Shop B;Tool B", leaf)
    └── Tool C (key: "Shop B;Tool C", leaf)
```

**Row Hierarchy Properties:**
- Depth: 2 levels (Customer at level 0, Product at level 1)
- Total leaf nodes: 6 (3 products per customer × 2 customers)
- Total height for row headers: 2 × 40px = 80px

### Column Hierarchy (Year → Month → Measure)

```
Year (Level 0)
├── 2024 (key: "2024", spans 3 months × 2 measures = 6 leaf nodes)
│   ├── Month 1 (key: "2024;1", spans 2 measures)
│   │   ├── Recalled (key: "2024;1;Recalled", leaf)
│   │   └── Sold (key: "2024;1;Sold", leaf)
│   ├── Month 2 (key: "2024;2", spans 2 measures)
│   │   ├── Recalled (key: "2024;2;Recalled", leaf)
│   │   └── Sold (key: "2024;2;Sold", leaf)
│   └── Month 3 (key: "2024;3", spans 2 measures)
│       ├── Recalled (key: "2024;3;Recalled", leaf)
│       └── Sold (key: "2024;3;Sold", leaf)
└── 2025 (key: "2025", spans 3 months × 2 measures = 6 leaf nodes)
    ├── Month 1 (key: "2025;1", spans 2 measures)
    │   ├── Recalled (key: "2025;1;Recalled", leaf)
    │   └── Sold (key: "2025;1;Sold", leaf)
    ├── Month 2 (key: "2025;2", spans 2 measures)
    │   ├── Recalled (key: "2025;2;Recalled", leaf)
    │   └── Sold (key: "2025;2;Sold", leaf)
    └── Month 3 (key: "2025;3", spans 2 measures)
        ├── Recalled (key: "2025;3;Recalled", leaf)
        └── Sold (key: "2025;3;Sold", leaf)
```

**Column Hierarchy Properties:**
- Depth: 3 levels (Year at level 0, Month at level 1, Measure at level 2)
- Total leaf nodes: 12 (2 years × 3 months × 2 measures)
- Total width for column headers: 3 × 40px = 120px (3 levels)

## Expected Grid Layout

### Grid Dimensions

- **Row Header Width**: 2 levels × 120px = 240px
- **Column Header Height**: 3 levels × 40px = 120px
- **Data Area Width**: 12 leaf columns × 120px = 1440px
- **Data Area Height**: 6 leaf rows × 40px = 240px
- **Total Grid Width**: 240px + 1440px = 1680px
- **Total Grid Height**: 120px + 240px = 360px

### Expected HTML Structure

```html
<div class="pivot-grid-wrapper" style="position: relative; width: 1680px; height: 360px;">
    
    <!-- Corner Cell (top-left empty space for header intersection) -->
    <div class="corner-cell" style="position: absolute; left: 0px; top: 0px; width: 240px; height: 120px;"></div>
    
    <!-- ======================================================================== -->
    <!-- COLUMN HEADERS (Year -> Month -> Measure) -->
    <!-- ======================================================================== -->
    
    <!-- Level 0: Year headers -->
    
    <!-- 2024: spans all 3 months × 2 measures = 6 leaf columns -->
    <div class="grid-cell header column-header hierarchy-level-0" 
         style="position: absolute; left: 240px; top: 0px; width: 720px; height: 40px;">
        2024
    </div>
    
    <!-- 2025: spans all 3 months × 2 measures = 6 leaf columns -->
    <div class="grid-cell header column-header hierarchy-level-0" 
         style="position: absolute; left: 960px; top: 0px; width: 720px; height: 40px;">
        2025
    </div>
    
    <!-- Level 1: Month headers (under Year) -->
    
    <!-- 2024, Month 1: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 240px; top: 40px; width: 240px; height: 40px;">
        1
    </div>
    
    <!-- 2024, Month 2: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 480px; top: 40px; width: 240px; height: 40px;">
        2
    </div>
    
    <!-- 2024, Month 3: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 720px; top: 40px; width: 240px; height: 40px;">
        3
    </div>
    
    <!-- 2025, Month 1: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 960px; top: 40px; width: 240px; height: 40px;">
        1
    </div>
    
    <!-- 2025, Month 2: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 1200px; top: 40px; width: 240px; height: 40px;">
        2
    </div>
    
    <!-- 2025, Month 3: spans 2 measures -->
    <div class="grid-cell header column-header hierarchy-level-1" 
         style="position: absolute; left: 1440px; top: 40px; width: 240px; height: 40px;">
        3
    </div>
    
    <!-- Level 2: Measure headers (under Month) -->
    
    <!-- 2024, Month 1, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 240px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2024, Month 1, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 360px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- 2024, Month 2, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 480px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2024, Month 2, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 600px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- 2024, Month 3, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 720px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2024, Month 3, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 840px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- 2025, Month 1, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 960px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2025, Month 1, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 1080px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- 2025, Month 2, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 1200px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2025, Month 2, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 1320px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- 2025, Month 3, Recalled -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 1440px; top: 80px; width: 120px; height: 40px;">
        Recalled
    </div>
    
    <!-- 2025, Month 3, Sold -->
    <div class="grid-cell header column-header hierarchy-level-2" 
         style="position: absolute; left: 1560px; top: 80px; width: 120px; height: 40px;">
        Sold
    </div>
    
    <!-- ======================================================================== -->
    <!-- ROW HEADERS (Customer -> Product) -->
    <!-- ======================================================================== -->
    
    <!-- Level 0: Customer headers -->
    
    <!-- Shop A: spans 3 products -->
    <div class="grid-cell header row-header hierarchy-level-0" 
         style="position: absolute; left: 0px; top: 120px; width: 120px; height: 120px;">
        Shop A
    </div>
    
    <!-- Shop B: spans 3 products -->
    <div class="grid-cell header row-header hierarchy-level-0" 
         style="position: absolute; left: 0px; top: 240px; width: 120px; height: 120px;">
        Shop B
    </div>
    
    <!-- Level 1: Product headers (under Customer) -->
    
    <!-- Shop A, Tool A -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 120px; width: 120px; height: 40px;">
        Tool A
    </div>
    
    <!-- Shop A, Tool B -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 160px; width: 120px; height: 40px;">
        Tool B
    </div>
    
    <!-- Shop A, Tool C -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 200px; width: 120px; height: 40px;">
        Tool C
    </div>
    
    <!-- Shop B, Tool A -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 240px; width: 120px; height: 40px;">
        Tool A
    </div>
    
    <!-- Shop B, Tool B -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 280px; width: 120px; height: 40px;">
        Tool B
    </div>
    
    <!-- Shop B, Tool C -->
    <div class="grid-cell header row-header hierarchy-level-1" 
         style="position: absolute; left: 120px; top: 320px; width: 120px; height: 40px;">
        Tool C
    </div>
    
    <!-- ======================================================================== -->
    <!-- DATA CELLS -->
    <!-- ======================================================================== -->
    
    <!-- Row 0: Shop A, Tool A -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 120px; width: 120px; height: 40px;">3</div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 120px; width: 120px; height: 40px;">5</div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 120px; width: 120px; height: 40px;">3</div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 120px; width: 120px; height: 40px;">5</div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 120px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 120px; width: 120px; height: 40px;"></div>
    
    <!-- Row 1: Shop A, Tool B -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 160px; width: 120px; height: 40px;">20</div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 160px; width: 120px; height: 40px;">15</div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 160px; width: 120px; height: 40px;">20</div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 160px; width: 120px; height: 40px;">15</div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 160px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 160px; width: 120px; height: 40px;"></div>
    
    <!-- Row 2: Shop A, Tool C -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 200px; width: 120px; height: 40px;">4</div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 200px; width: 120px; height: 40px;">303</div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 200px; width: 120px; height: 40px;">4</div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 200px; width: 120px; height: 40px;">303</div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 200px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 200px; width: 120px; height: 40px;"></div>
    
    <!-- Row 3: Shop B, Tool A -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 240px; width: 120px; height: 40px;">43</div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 240px; width: 120px; height: 40px;">320</div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 240px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 240px; width: 120px; height: 40px;">43</div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 240px; width: 120px; height: 40px;">320</div>
    
    <!-- Row 4: Shop B, Tool B -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 280px; width: 120px; height: 40px;">43</div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 280px; width: 120px; height: 40px;">302</div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 280px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 280px; width: 120px; height: 40px;">43</div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 280px; width: 120px; height: 40px;">302</div>
    
    <!-- Row 5: Shop B, Tool C -->
    <div class="grid-cell" style="position: absolute; left: 240px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 360px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 480px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 600px; top: 320px; width: 120px; height: 40px;">41</div>
    <div class="grid-cell" style="position: absolute; left: 720px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 840px; top: 320px; width: 120px; height: 40px;">500</div>
    <div class="grid-cell" style="position: absolute; left: 960px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1080px; top: 320px; width: 120px; height: 40px;">41</div>
    <div class="grid-cell" style="position: absolute; left: 1200px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1320px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1440px; top: 320px; width: 120px; height: 40px;"></div>
    <div class="grid-cell" style="position: absolute; left: 1560px; top: 320px; width: 120px; height: 40px;">500</div>
    
</div>
```

## Data Cell Values Reference

The data cells contain the aggregated values from the CSV. Each cell represents the intersection of:
- A row (Customer + Product)
- A column (Year + Month + Measure)

### Sample Data Points

| Row (Customer;Product) | Column (Year;Month;Measure) | Value |
|---|---|---|
| Shop A;Tool A | 2024;1;Recalled | 3 |
| Shop A;Tool A | 2024;1;Sold | 5 |
| Shop A;Tool A | 2025;1;Recalled | 3 |
| Shop A;Tool A | 2025;1;Sold | 5 |
| Shop A;Tool B | 2024;1;Recalled | 20 |
| Shop A;Tool B | 2024;1;Sold | 15 |
| Shop A;Tool B | 2025;1;Recalled | 20 |
| Shop A;Tool B | 2025;1;Sold | 15 |
| Shop A;Tool C | 2024;2;Recalled | 4 |
| Shop A;Tool C | 2024;2;Sold | 303 |
| Shop A;Tool C | 2025;2;Recalled | 4 |
| Shop A;Tool C | 2025;2;Sold | 303 |
| Shop B;Tool A | 2024;3;Recalled | 43 |
| Shop B;Tool A | 2024;3;Sold | 320 |
| Shop B;Tool A | 2025;3;Recalled | 43 |
| Shop B;Tool A | 2025;3;Sold | 320 |
| Shop B;Tool B | 2024;3;Recalled | 43 |
| Shop B;Tool B | 2024;3;Sold | 302 |
| Shop B;Tool B | 2025;3;Recalled | 43 |
| Shop B;Tool B | 2025;3;Sold | 302 |
| Shop B;Tool C | 2024;1;Recalled | 41 |
| Shop B;Tool C | 2024;1;Sold | 500 |
| Shop B;Tool C | 2025;1;Recalled | 41 |
| Shop B;Tool C | 2025;1;Sold | 500 |

**Note**: Empty cells in the HTML structure above represent positions where no data exists for that particular combination of dimensions.

## Success Criteria

The PivotGridTable component should:

1. Render hierarchical column headers with correct spanning (Year spans over Months, Month spans over Measures)
2. Render hierarchical row headers with correct spanning (Customer spans over Products)
3. Position all header cells at the correct (left, top) coordinates
4. Size all header cells with the correct (width, height) dimensions
5. Display all data cells at the correct positions
6. Show empty cells where no data exists
7. Maintain consistent styling (background colors, borders, fonts) per hierarchy level

## Implementation Notes

- The `HierarchyCellGenerator` service calculates positions using the `countLeafNodes` function to determine spans
- Column mode: Nodes flow horizontally, children positioned below parent
- Row mode: Nodes flow vertically, children positioned to the right of parent
- Each node's width/height = span × baseCellWidth/baseCellHeight
- The corner cell fills the top-left space where row and column headers would intersect

## Related Files

- [Dev Plan](./devPlan.md) - Implementation plan for hierarchical headers
- [PivotDataService.ts](../../../src/services/PivotDataService.ts) - Builds hierarchy data
- [HierarchyCellGenerator.ts](../../../src/services/helpers/HierarchyCellGenerator.ts) - Calculates cell positions
- [PivotGridTable.tsx](../../../src/screens/view-grid/components/GridMain/PivotGridTable.tsx) - Renders the grid


