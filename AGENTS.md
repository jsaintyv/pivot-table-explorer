# AGENTS.md - Pivot Table Explorer

## Project Overview

This is a **React + TypeScript** project featuring a **PivotGrid component** for data exploration, inspired by Excel pivot tables. The component allows users to dynamically organize and aggregate data along custom row and column axes.

## Project Structure

```
pivot-table-explorer/
├── docs/ 
│   ├── screens/
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

## Architecture

One store by screen, a store could reference many stores
./src/screens/ contains a component by screen

a screen can be compose with many component ./src/components


