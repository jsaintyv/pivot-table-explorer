# AGENTS.md - Pivot Table Explorer

## Project Overview

This is a **React + TypeScript** project featuring a **PivotGrid component** for data exploration, inspired by Excel pivot tables. The component allows users to dynamically organize and aggregate data along custom row and column axes.

## Project Structure

```
pivot-table-explorer/
├── src/
│   ├── components/
│   │   ├── PivotGrid.tsx      # Main pivot table component
│   │   └── PivotGrid.css      # Component styles
│   ├── App.tsx               # Demo application
│   ├── App.css               # App styles
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development Guidelines

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: CSS Modules / Vanilla CSS
- **Language**: TypeScript (strict mode)

### Code Style
- Use **Functional Components** with React Hooks
- Type all props and state with **TypeScript interfaces**
- Use **descriptive type names** for complex types
- Follow **React best practices** (useState, useEffect, useMemo, useCallback)
- **Component naming**: PascalCase (e.g., `PivotGrid`, `DataCell`)
- **File naming**: `ComponentName.tsx`, `ComponentName.css`
- **Variable naming**: camelCase for variables, UPPER_CASE for constants

### TypeScript Conventions
- Define **interfaces** for complex data structures
- Use **type aliases** for union types and literal types
- Always specify **return types** for functions
- Use **generics** when appropriate for reusable components
- Handle **null/undefined** cases explicitly

### Component Architecture

#### PivotGrid Component
- **Props**:
  - `data`: Array of objects to pivot
  - `defaultRowFields`: Initial row dimension fields
  - `defaultColumnFields`: Initial column dimension fields
  - `defaultValueFields`: Fields to aggregate
  - `defaultAggregation`: Aggregation function ('sum' | 'avg' | 'count' | 'min' | 'max')

- **State**:
  - `rowFields`: Selected row dimensions
  - `columnFields`: Selected column dimensions
  - `valueFields`: Selected value fields
  - `aggregation`: Selected aggregation function

- **Core Logic**:
  - Generate all combinations of row and column values
  - Filter data matching each row/column combination
  - Apply aggregation functions to value fields
  - Build pivot grid structure with proper row/column spans

### Feature Enhancements (Future Work)

If extending this project, consider:

1. **Performance Optimization**
   - Implement virtualization for large datasets
   - Use Web Workers for heavy computation
   - Add memoization for expensive calculations

2. **Additional Features**
   - Sorting (row and column)
   - Filtering (pre-filter data before pivoting)
   - Multiple value fields with separate columns
   - Hierarchical row/column headers
   - Grand totals (row and column)
   - Conditional formatting

3. **Data Handling**
   - Async data loading support
   - Data validation and error handling
   - Support for nested data structures

4. **UI Improvements**
   - Drag-and-drop field selection
   - Field reordering
   - Save/load configurations
   - Export to CSV/Excel
   - Dark mode support

5. **Advanced Aggregations**
   - Custom aggregation functions
   - Multiple aggregations per value field
   - Percentage of total calculations
   - Running totals

## Testing

- Verify with different dataset sizes
- Test edge cases (empty data, single row/column)
- Validate aggregation results against known values
- Test responsive behavior on various screen sizes

## Dependencies

Current dependencies:
- react
- react-dom
- typescript
- vite
- @types/react
- @types/react-dom

No external library dependencies - pure React + TypeScript implementation.

## Build & Run

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Type checking
npx tsc --noEmit
```

## Version History

- **v1.0.0** (2026-06-07): Initial implementation with TypeScript
  - Basic pivot table functionality
  - 5 aggregation functions
  - Row and column field selection
  - Responsive design
  - Sample datasets

## Contact

For questions about this project, refer to the main repository documentation.
