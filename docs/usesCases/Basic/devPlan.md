# Dev Plan: Hierarchical Headers in PivotGridTable

**Use Case**: [useCase.md](./useCase.md)
**Status**: 🟢 Phase 1, 2 & 3 Completed
**Last Updated**: 2026-06-24

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
| 1.1 | Move `PivotData`,`PivotCellMap`,`PivotAxe`,`PivotCell` to src/models/pivot-data/pivot-data.ts | `src/stores/ViewStore.ts` | ✅ | None |
| 1.2 | Define `PivotAxeHierarchy` in src/models/pivot-data/pivot-data.ts | `src/models/pivot-data/pivot-data.ts` | ✅ | None |
| 1.3 | Update `PivotData` type to include hierarchies | `src/models/pivot-data/pivot-data.ts` | ✅ | 1.1 |

**Phase 1 Status**: ✅ 100% (3/3)

---

### Phase 2: Pivot Data Service

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 2.1 | Create `buildHierarchyFromAxeKeys` utility | `src/services/PivotDataService.ts` | ✅ | 1.1, 1.2 |
| 2.2 | Create `buildColumnHierarchyWithMeasures` | `src/services/PivotDataService.ts` | ✅ | 2.1 |
| 2.3 | Generate unit test which verify `buildHierarchyFromAxeKeys` & `buildColumnHierarchyWithMeasures` | `src/services/__tests__/PivotDataService.test.ts` | ✅ | 2.1, 2.2 |
| 2.4 | Update `buildPivotData` to generate hierarchies | `src/services/PivotDataService.ts` | ✅ | 2.1, 2.2 |
| 2.5 | Generate unit test which verify `buildPivotData` | `src/services/__tests__/PivotDataService.test.ts` | ✅ | 2.4 |

**Phase 2 Status**: ✅ 100% (5/5)

---

### Phase 3: Build generator

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 3.1 | Create interface `CellsGeneratorParam {baseCellWidth: number, baseCellHeight:number, startLeft:number, startTop:number, mode: 'ROW' | 'COLUMN'}` | `src/services/helpers/CellGenerator.ts` | ✅ | Phase 1, 2 |
| 3.2 | Create `cellsGenerator(hierarchy: PivotAxeHierarchy, params: CellsGeneratorParam, (top, left, width, height) => any)` | `src/services/helpers/CellGenerator.ts` | ✅ | 3.1 |
| 3.3 | Create `src/services/__tests__/CellsGenerator.test.ts` | `src/services/__tests__/CellsGenerator.test.ts` | ✅ | 3.2 |

**Phase 3 Status**: ✅ 100% (3/3)


---

### Phase 4: PivotGridTable Refactoring

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 4.1 | Add position calculation utilities | `PivotGridTable.tsx` | ❌ | Phase 1, 2, 3 |
| 4.2 | Create `renderHierarchyHeaders` function | `PivotGridTable.tsx` | ❌ | 4.1 |
| 4.3 | Create `renderRowHierarchyHeaders` function | `PivotGridTable.tsx` | ❌ | 4.1 |
| 4.4 | Update data cell rendering | `PivotGridTable.tsx` | ❌ | 4.1 |
| 4.5 | Update visible cells calculation | `PivotGridTable.tsx` | ❌ | 4.1-4.4 |
| 4.6 | Add CSS classes for hierarchy levels | `PivotGridTable.tsx` | ❌ | 4.1 |

**Phase 4 Status**: ❌ 0% (0/6)

---

### Phase 5: Testing & Validation

| # | Task | File | Status | Dependencies |
|---|------|------|--------|--------------|
| 5.1 | Manual test with useCase data | Browser | ❌ | All |
| 5.2 | Run existing tests | `npm run test` | ❌ | All |
| 5.3 | Run Playwright tests | `npx playwright test` | ❌ | All |
| 5.4 | Run build | `npm run build` | ❌ | All |

**Phase 5 Status**: ❌ 0% (0/4)

---

## Overall Progress

- **Total Tasks**: 15
- **Completed**: 11
- **In Progress**: 0
- **Remaining**: 4
- **Progress**: 73% (Phase 1, 2 & 3 complete)

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

1. `src/models/pivot-data/pivot-data.ts` - Hierarchy types
2. `src/services/PivotDataService.ts` - Generate hierarchies
3. `src/services/helpers/CellGenerator.ts` - Cell position generator
4. `src/screens/view-grid/components/GridMain/PivotGridTable.tsx` - Hierarchical rendering

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
- [x] All tests pass
- [x] Build succeeds
- [ ] Output matches [useCase.md](./useCase.md)

---

*Update statuses as tasks are completed.*
