# OpenMFP Web Components Library

A modern Angular 21 web components library featuring declarative UI components built with the latest signal-based APIs.

![Build Status](https://github.com/openmfp/webcomponents/actions/workflows/pipeline.yaml/badge.svg)

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

# Generate coverage report
npm run test:cov
```

### Storybook

Storybook is used to develop, document, and visually test components in isolation. Stories live alongside components under `projects/ngx/**/stories/*.stories.ts`.

```bash
# Start Storybook in development mode (default port: 6006)
npm run storybook

# Build a static Storybook site (output: storybook-static/)
npm run build:storybook
```

Once running, open Storybook at [http://localhost:6006/](http://localhost:6006/).

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

| Angular tag                    | Web Component tag                 | Documentation                                                    |
| ------------------------------ | --------------------------------- | ---------------------------------------------------------------- |
| `<mfp-declarative-table>`      | `<mfp-wc-declarative-table>`      | [docs/declarative-table.md](docs/declarative-table.md)           |
| `<mfp-declarative-form>`       | `<mfp-wc-declarative-form>`       | [docs/declarative-form.md](docs/declarative-form.md)             |
| `<mfp-declarative-table-card>` | `<mfp-wc-declarative-table-card>` | [docs/declarative-table-card.md](docs/declarative-table-card.md) |
| `<mfp-dashboard>`              | `<mfp-wc-dashboard>`              | [docs/dashboard.md](docs/dashboard.md)                           |

## Publishing & versioning

This repository publishes two npm packages from a single release:

| Package                  | Built from           | Contents                                             |
| ------------------------ | -------------------- | ---------------------------------------------------- |
| `@openmfp/ngx`           | `dist/ngx`           | The Angular library (components, directives, models) |
| `@openmfp/webcomponents` | `dist/webcomponents` | The framework-agnostic custom-element bundles        |

**Versions are locked together.** The release workflow computes one version from
the conventional-commit history and applies it to both packages before
publishing, so `@openmfp/ngx` and `@openmfp/webcomponents` always share the same
version number. The `version` fields committed in `package.json` and
`projects/ngx/package.json` are placeholders — CI overwrites both with the
computed release version at publish time. Consumers can therefore install
matching versions of the two packages without cross-referencing a table.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and openMFP contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmfp/portal-ui-lib).

## NeoNephos Foundation

This project is part of the [NeoNephos Foundation](https://neonephos.org), a Linux Foundation Europe initiative.

<p align="center"><img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="400"/></p>
