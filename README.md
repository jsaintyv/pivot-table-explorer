# Pivot Table Explorer

A React + TypeScript component for creating Excel-like pivot tables for data exploration. This project provides a powerful and flexible way to aggregate and visualize data along custom row and column axes.

## Features

- **Dynamic Pivot Tables**: Create pivot tables from any array of objects
- **Multiple Aggregations**: Support for SUM, AVG, COUNT, MIN, MAX aggregation functions
- **Flexible Configuration**: Choose row fields, column fields, and value fields dynamically
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **TypeScript Support**: Fully typed with comprehensive type definitions
- **Test Coverage**: 67 tests covering all aggregation functions and component functionality

## Project Structure

```
pivot-table-explorer/
├── src/
│   ├── models/               # Type definitions and data models
│   │   ├── index.ts          # Exports all types
│   │   └── types.ts          # All TypeScript interfaces and types
│   │
│   ├── utils/               # Utility functions
│   │   ├── index.ts          # Exports all utilities
│   │   ├── aggregations.ts   # Aggregation functions (sum, avg, count, min, max)
│   │   └── aggregations.test.ts # Tests for aggregation functions
│   │
│   ├── components/          # React components
│   │   ├── PivotGrid.tsx     # Main pivot table component
│   │   ├── PivotGrid.css     # Component styles
│   │   └── PivotGrid.test.tsx # Component tests
│   │
│   ├── test/                # Test configuration
│   │   ├── index.ts          # Test entry point
│   │   └── setup.ts          # Test setup file
│   │
│   ├── App.tsx              # Demo application with examples
│   ├── App.css              # Application styles
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
│
├── docs/                   # Documentation
│   └── README.md           # Documentation entry point
│
├── AGENTS.md               # Development guidelines for AI agents
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts           # Vite configuration
└── vitest.config.ts         # Vitest configuration
```

## Installation

```bash
npm install
```

## Running the Project

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run with UI

```bash
npm run test:ui
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run in Watch Mode

```bash
npm run test:watch
```

## Usage

### Basic Usage

```tsx
import PivotGrid from './components/PivotGrid';

const data = [
  { region: 'North', product: 'Laptop', sales: 10000, profit: 2000 },
  { region: 'North', product: 'Phone', sales: 8000, profit: 1500 },
  { region: 'South', product: 'Laptop', sales: 12000, profit: 2500 },
  // ... more data
];

<PivotGrid
  data={data}
  defaultRowFields={['region']}
  defaultColumnFields={['product']}
  defaultValueFields={['sales']}
  defaultAggregation="sum"
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `DataItem[]` | Yes | - | Array of objects to pivot |
| `defaultRowFields` | `string[]` | No | `[]` | Initial fields for rows (Y-axis) |
| `defaultColumnFields` | `string[]` | No | `[]` | Initial fields for columns (X-axis) |
| `defaultValueFields` | `string[]` | No | `[]` | Initial fields to aggregate |
| `defaultAggregation` | `AggregationFunction` | No | `'sum'` | Initial aggregation function |

### Available Aggregation Functions

- **sum** - Sum of all values
- **avg** - Average of all values
- **count** - Count of records
- **min** - Minimum value
- **max** - Maximum value

## Sample Data

The project includes two sample datasets for demonstration:

1. **Sales Data**: 22 records of product sales across regions, products, and quarters
2. **Personnel Data**: 12 records of employee information

## Architecture

### Models (`src/models/`)

- **DataItem**: Generic data item type with string keys
- **Cell**: Pivot table cell with value and metadata
- **PivotData**: Complete pivot data structure (rows, columns, grid)
- **AggregationFunction**: Type for aggregation function names
- **PivotGridProps**: Props interface for the PivotGrid component

### Utilities (`src/utils/`)

- **aggregationFunctions**: Registry of all aggregation implementations
- **sumAggregation, avgAggregation, countAggregation, minAggregation, maxAggregation**: Individual aggregation functions
- **getAggregationFunction**: Get aggregation function by name
- **getAggregationFunctionNames**: Get list of all aggregation function names
- **isValidAggregationFunction**: Type guard for aggregation function names

### Components (`src/components/`)

- **PivotGrid**: Main component with state management and pivot logic
- **PivotGrid.css**: Component-specific styles

## Development

### Adding New Aggregation Functions

1. Add the function to `src/utils/aggregations.ts`
2. Add it to the `aggregationFunctions` registry
3. Add tests in `src/utils/aggregations.test.ts`

### Adding New Features

- Sorting (row and column)
- Filtering (pre-filter data before pivoting)
- Multiple value fields with separate columns
- Hierarchical row/column headers
- Grand totals (row and column)
- Conditional formatting

See [AGENTS.md](AGENTS.md) for detailed development guidelines.

## Technologies

- **React 19** - Frontend framework
- **TypeScript** - Type system
- **Vite** - Build tool and development server
- **Vitest** - Test framework
- **Testing Library** - React component testing
- **CSS** - Styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` to ensure all tests pass
6. Run `npm run build` to verify production build
7. Submit a pull request

## License

MIT

## Version

1.0.0 - June 7, 2026
