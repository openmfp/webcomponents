# @openmfp/ngx

Angular component library for OpenMFP — declarative UI components built with Angular 21 signal-based APIs.

![Build Status](https://github.com/openmfp/webcomponents/actions/workflows/pipeline.yaml/badge.svg)

## ✨ Features

- **Angular 21** - Built with the latest Angular features and signal-based APIs
- **Standalone Components** - No NgModule required, import directly
- **Declarative UI** - Table, form, and dashboard driven by JSON schemas
- **TypeScript** - Full type safety with strict mode
- **Tree-Shakeable** - Optimized bundle size with ES modules

## 🚀 Getting Started

### Installation

```bash
npm install @openmfp/ngx
```

### Usage

All components are standalone — import them directly in your component or module:

```typescript
import { DeclarativeTable, DeclarativeForm, Dashboard } from '@openmfp/ngx';

@Component({
  imports: [DeclarativeTable],
  template: `<mfp-declarative-table [config]="tableConfig" />`,
})
export class MyComponent {}
```

## Components

### Declarative UI

| Selector | Description | Documentation |
|---|---|---|
| `<mfp-declarative-table>` | Data table driven by a JSON schema | [docs/declarative-table.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-table.md) |
| `<mfp-declarative-form>` | Form driven by a JSON schema | [docs/declarative-form.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-form.md) |
| `<mfp-declarative-table-card>` | Table with card wrapper and create/edit/delete dialogs | [docs/declarative-table-card.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-table-card.md) |
| `<mfp-dashboard>` | Drag-and-drop dashboard layout | [docs/dashboard.md](https://github.com/openmfp/webcomponents/blob/main/docs/dashboard.md) |

## NeoNephos Foundation

This project is part of the [NeoNephos Foundation](https://neonephos.org), a Linux Foundation Europe initiative.

<p align="center"><img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="400"/></p>
