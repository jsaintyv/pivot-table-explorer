# Pivot Table Explorer

A React + TypeScript component for creating Excel-like pivot tables for data exploration. 
This project provides a powerful and flexible way to aggregate and visualize data along custom row and column axes.

This is a work in progress. I'm using Mistral Vibe extensively to build it.

## Data-management

This project keep data in your browser in IndexDB. 
It don't need a server to work, you could load it in any static HTTP server (Apache HTTP , Nginx, ...)
or why like bellow in github.io

## Try it 

Follow [https://jsaintyv.github.io/jsaintyv/](https://jsaintyv.github.io/jsaintyv/) 

## TODO

- Allow configure multiple support hierarchical dimensions (parent column, or generation column)
- Enhance grid speed
- Add support of Excel files
- Add charts restitution 
- Add mathematical transformation

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

### Adding New Features

See [AGENTS.md](AGENTS.md) for detailed development guidelines.

## Technologies

- **React 19** - Frontend framework
- **TypeScript** - Type system
- **Vite** - Build tool and development server
- **Vitest** - Test framework
- **Testing Library** - React component testing
- **CSS** - Styling
- Realize with Mistral Vibe

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` to ensure all tests pass
6. Run `npm run build` to verify production build
7. Submit a pull request

**Important Guidelines**
To avoid frustration, I will systematically reject any changes that:
- Require adding external dependencies
- Introduce the ability to evaluate dynamically injected code


## License

The GNU General Public License (GPL) V2

## Version

1.0.0 - June 7, 2026
