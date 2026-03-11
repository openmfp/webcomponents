# OpenMFP Web Components Library

A modern Angular 21 web components library featuring declarative UI components built with the latest signal-based APIs.

![Build Status](https://github.com/platform-mesh/portal-ui-lib/actions/workflows/pipeline.yaml/badge.svg)

## ✨ Features

- **Angular 21** - Built with the latest Angular features and signal-based APIs
- **Web Components Ready** - Exportable as native web components via Angular Elements
- **Declarative UI** - Intuitive generic ui component
- **Vitest Testing** - Fast, modern testing framework
- **TypeScript** - Full type safety with strict mode
- **Tree-Shakeable** - Optimized bundle size with ES modules

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Build the library
npm run build
```

### Build Commands

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
# Build once
npm run build

# Build in watch mode (for development)
npm run build:watch

# Build and publish to yalc (for local testing)
npm run build:watch:yalc
```

### Testing

Run `npm run test` to execute unit tests with Vitest.

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:cov
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run check-format
```

### Web Components Support

Components can be exported as native web components using Angular Elements, making them framework-agnostic.

## Components

| Component | Documentation |
|---|---|
| `<mfp-declarative-table>` | [docs/declarative-table.md](docs/declarative-table.md) |

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file in this repository for instructions on how to contribute to platform-mesh.

## Code of Conduct

Please refer to our [Code of Conduct](https://github.com/openmfp/.github/blob/main/CODE_OF_CONDUCT.md)
for information on the expected conduct for contributing to openMFP.


