# Dev Plan: Hierarchical Headers in PivotGridTable

**Use Case**: [useCase.md](./useCase.md)
**Status**: 🟡 Not Started
**Last Updated**: 2026-06-23

---

## Overview

This plan describes the implementation of hierarchical headers in `PivotGridTable.tsx` to match the expected output described in [useCase.md](./useCase.md).

**Target**: Display a pivot grid with multi-level column and row headers that span appropriately (simulating colspan/rowspan with width/height).

---

## Configuration

- **CELL_WIDTH**: 120px
- **CELL_HEIGHT**: 40px
- **Row Dimensions**: Customer → Product (2 levels)
- **Column Dimensions**: Year → Month (2 levels)
- **Measures**: Recalled, Sold (2 measures)

---

## Tasks & Status

### Phase 1: Data Structure Setup

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 1.1 | Define `PivotAxeHierarchy` type | `src/stores/ViewStore.ts` | ❌ | None |
| 1.2 | Update `PivotData` type to include hierarchies | `src/stores/ViewStore.ts` | ❌ | 1.1 |

**Phase 1 Status**: ❌ 0% (0/2)

---

### Phase 2: Pivot Data Service

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 2.1 | Create `buildHierarchyFromAxeKeys` utility | `src/services/PivotDataService.ts` | ❌ | 1.1, 1.2 |
| 2.2 | Create `buildColumnHierarchyWithMeasures` | `src/services/PivotDataService.ts` | ❌ | 2.1 |
| 2.3 | Update `buildPivotData` to generate hierarchies | `src/services/PivotDataService.ts` | ❌ | 2.1, 2.2 |

**Phase 2 Status**: ❌ 0% (0/3)

---

### Phase 3: PivotGridTable Refactoring

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 3.1 | Add position calculation utilities | `PivotGridTable.tsx` | ❌ | Phase 1, 2 |
| 3.2 | Create `renderHierarchyHeaders` function | `PivotGridTable.tsx` | ❌ | 3.1 |
| 3.3 | Create `renderRowHierarchyHeaders` function | `PivotGridTable.tsx` | ❌ | 3.1 |
| 3.4 | Update data cell rendering | `PivotGridTable.tsx` | ❌ | 3.1 |
| 3.5 | Update visible cells calculation | `PivotGridTable.tsx` | ❌ | 3.1-3.4 |
| 3.6 | Add CSS classes for hierarchy levels | `PivotGridTable.tsx` | ❌ | 3.1 |

**Phase 3 Status**: ❌ 0% (0/6)

---

### Phase 4: Testing & Validation

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 4.1 | Manual test with useCase data | Browser | ❌ | All |
| 4.2 | Run existing tests | `npm run test` | ❌ | All |
| 4.3 | Run Playwright tests | `npx playwright test` | ❌ | All |
| 4.4 | Run build | `npm run build` | ❌ | All |

**Phase 4 Status**: ❌ 0% (0/4)

---

## Overall Progress

- **Total Tasks**: 15
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 15
- **Progress**: 0%

---

## Expected Output

Based on [useCase.md](./useCase.md), the component should render hierarchical headers:

- Column headers span over their children (Year spans over all Months, Month spans over all Measures)
- Row headers span over their children (Customer spans over all Products)
- Each measure appears as a leaf column header
- Each product appears as a leaf row header

---

## Data Structure Example

### Column Hierarchy (Year → Month → Measure)
```typescript
{
  key: "2024",
  level: 0,
  value: "2024",
  dimensionId: "Year",
  children: [
    {
      key: "2024;1",
      level: 1,
      value: "1",
      dimensionId: "Month",
      children: [
        { key: "2024;1;Recalled", level: 2, value: "Recalled", leaf: true },
        { key: "2024;1;Sold", level: 2, value: "Sold", leaf: true }
      ]
    }
    // ... Month 2, 3
  ]
}
```

### Row Hierarchy (Customer → Product)
```typescript
{
  key: "Shop A",
  level: 0,
  value: "Shop A",
  dimensionId: "Customer",
  children: [
    { key: "Shop A;Tool A", level: 1, value: "Tool A", leaf: true },
    { key: "Shop A;Tool B", level: 1, value: "Tool B", leaf: true },
    { key: "Shop A;Tool C", level: 1, value: "Tool C", leaf: true }
  ]
}
```

---

## Files to Modify

1. `src/stores/ViewStore.ts` - Add hierarchy types
2. `src/services/PivotDataService.ts` - Generate hierarchies
3. `src/screens/view-grid/components/GridMain/PivotGridTable.tsx` - Hierarchical rendering

---

## Commands to Run After Implementation

```bash
npx tsc --noEmit
npm run build
npm run test
npx playwright test
```

---

## Success Criteria

- [ ] Column headers display hierarchically with correct spanning
- [ ] Row headers display hierarchically with correct spanning
- [ ] Data cells in correct positions
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Output matches [useCase.md](./useCase.md)

---

*Update statuses as tasks are completed.*
