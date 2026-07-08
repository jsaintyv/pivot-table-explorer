# AGENTS.md - Pivot Table Explorer

## Project Overview

This is a **React + TypeScript** project featuring a **PivotGrid component** for data exploration, inspired by Excel pivot tables. The component allows users to dynamically organize and aggregate data along custom row and column axes.

## Project Structure

```
pivot-table-explorer/
├── docs/ 
│   ├── models/               # Describe models and business functions which transform models
│   ├── screens/              # Describe screens
├── src/
│   ├── components/           # Common components shared between screens
│   ├── screens/              # Screens, one screen per subfolder
│   ├── stores/               # MobX stores (singletons)
│   ├── services/             # Services for model operations
│   ├── models/               # Data models and interfaces
│   ├── App.tsx               # Demo application
│   ├── App.css               # App styles
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── package.json
├── tests/                    # End-to-end tests (Playwright)
├── tsconfig.json
└── vite.config.ts
```

## Development Guidelines

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: CSS Modules / Vanilla CSS
- **Language**: TypeScript (strict mode)
- **State Management**: MobX
- **E2E Testing**: Playwright

### Typescript / React guidelines
See [@docs/typescript/pattern.md](docs/typescript/pattern.md)

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

# Unit tests
npm run test

# End-to-end tests
npx playwright test

# End-to-end tests with UI
npx playwright test --ui

# End-to-end tests headed mode
npx playwright test --headed
```

*** Never end development without checking that `npm run build`, `npm run test`, and `npx playwright test` succeed *** 

## Models

A project has these attributes:
- A list of source files
- A list of axes that allow pivoting data from source files
- A list of views. A view defines a grid that displays data.


## Documentation

The `/docs` folder contains the project documentation.
The `/docs/screens/screenflow.md` file describes navigation between screens.
The `/docs/useCases` folder contains some use cases documentation


## Architecture

- **Screen state is controlled by a singleton store**, instantiated at the screen level.
- The store is **propagated down via React Context** to child components.
- The `./src/screens/` directory contains a subfolder per screen.
- A screen can be composed of many components from `./src/components` or `./src/screens/{screenName}/{componentName}`.
- Use react-router-dom to navigate between screens.
- Each screen and each component should have its own subfolder.
- **Context files** are located in `src/stores/contexts/` for explicit store propagation.
- Follow [react/mobx pattern](../../../docs/typescript/pattern.md)


### Best Practices
- **Verify changes**: Always run `npm run build`, `npm run test`, and `npx playwright test` after Vibe’s edits.
- **Human oversight**: Review critical changes (e.g., state management, data models) before committing.
- **Context**: Reference existing code (e.g., "Like in `ViewStore.ts`, but for rows").
- **E2E Testing**: Use Playwright for end-to-end testing. Write tests in `tests/` directory and run them with `npx playwright test`.


## **Restrictions**

Do not automate the following actions:
- `git commit`
- `git add`
- `git push`
- `git stash`

These actions should only be operated by a human.
