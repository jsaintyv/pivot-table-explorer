# Use Case: Configure Hierarchical Dimensions

## Overview

This use case describes how to configure hierarchical dimensions and display them by generation level.
It demonstrates modifying the screen to show dimension data organized hierarchically.

**Generation Levels:**
- **Gen 1**: Parent categories (MEM, GRAPH)
- **Gen 2**: Child products (DDR4, DDR5 under MEM; NV5050, NV5060 under GRAPH)

The Product dimension forms a hierarchy tree:
```
MEM
├── DDR4
└── DDR5

GRAPH
├── NV5050
└── NV5060
```

## Input Data

### CSV Source Data

Product.csv
```csv
"ParentCode";"ProductCode";"Label"
"";"MEM";"Memory"
"MEM";"DDR4";"DDR 4"
"MEM";"DDR5";"DDR 5"
"";"GRAPH";"Graphic card"
"GRAPH";"NV5050";"Nvidia 5050"
"GRAPH";"NV5060";"Nvidia 5060"
```

Sale.csv
```csv
"ProductCode";"EMarket";"YEAR";"PERIOD";"Qty"
"DDR4";"CDiscount";"2024";"Q1";10
"DDR4";"CDiscount";"2024";"Q3";11
"DDR4";"CDiscount";"2024";"Q4";12
"DDR5";"CDiscount";"2024";"Q1";5
"DDR5";"CDiscount";"2024";"Q2";7
"DDR4";"Fnac";"2024";"Q1";100
"DDR5";"Fnac";"2024";"Q2";110
"DDR4";"Fnac";"2025";"Q1";200
"DDR5";"Fnac";"2025";"Q2";210
"NV5050";"Fnac";"2025";"Q1";100
"NV5050";"Fnac";"2025";"Q2";110
"NV5060";"Fnac";"2025";"Q1";50
"NV5060";"Fnac";"2025";"Q2";60
```

## Dimension Configuration

The `ProductCode` dimension is renamed to `Product` with the following field mappings:
- Code: `ProductCode`
- Parent: `ParentCode`
- Label: `Label`
- Source: `Product.csv` 


## View Configuration

### View: Test Configuration
```
Rows:
    * Product (Gen 1)
    * Product (Gen 2)

Columns:
    * Year

Measures:
    * Qty
```

**Note**: EMarket is not selected in rows or columns, so Qty values are aggregated across all EMarkets.

### Expected Result

```csv
"";"";"2024";"2025";""
"MEM";"DDR4";"33";"200";"233"
"MEM";"DDR5";"12";"210";"222"
"GRAPH";"NV5050";"";"210";"210"
"GRAPH";"NV5060";"";"110";"110"
```

