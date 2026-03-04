# OpenMFP Web Components Library

A modern Angular 21 web components library featuring declarative UI components built with the latest signal-based APIs.

![Build Status](https://github.com/platform-mesh/portal-ui-lib/actions/workflows/pipeline.yaml/badge.svg)

## ✨ Features

- **Angular 21** - Built with the latest Angular features and signal-based APIs
- **Standalone Components** - No NgModules, fully modern architecture
- **Web Components Ready** - Exportable as native web components via Angular Elements
- **Declarative UI** - Intuitive table component with sorting, filtering, and selection
- **Vitest Testing** - Fast, modern testing framework (no Jest)
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

## 📖 Components

### Table Component

A feature-rich table component with:
- ✅ Signal-based reactive state
- ✅ Sortable columns
- ✅ Filterable columns
- ✅ Row selection
- ✅ Custom cell formatting
- ✅ Declarative or programmatic column definitions
- ✅ Responsive design

See [projects/webcomponents/README.md](projects/webcomponents/README.md) for detailed documentation.

## 💡 Usage Examples

### As Angular Components

```typescript
import { TableComponent, TableColumn } from '@openmfp/webcomponents';

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `
    <omfp-table
      [data]="users"
      [columns]="columns"
      [sortable]="true"
      [filterable]="true">
    </omfp-table>
  `
})
export class MyComponent {
  users = [
    { name: 'John', email: 'john@example.com', age: 30 }
  ];

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'age', header: 'Age', sortable: true }
  ];
}
```

### As Web Components

```html
<script type="module">
  import { registerWebComponents } from '@openmfp/webcomponents';
  registerWebComponents();
</script>

<omfp-table
  data='[{"name":"John","age":30}]'
  columns='[{"key":"name","header":"Name"}]'
  sortable="true">
</omfp-table>
```

See [examples/](examples/) directory for complete examples.

## 🏗️ Architecture

### Modern Angular 21 APIs

This library uses the latest Angular 21 features:

- `input()` - Type-safe reactive inputs (replaces `@Input`)
- `output()` - Event emitters (replaces `@Output`)
- `signal()` - Reactive state management
- `computed()` - Derived reactive values
- `effect()` - Side effects and lifecycle
- `contentChildren()` - Query projected content

**No deprecated APIs:**
- ❌ No NgModules
- ❌ No `@Input/@Output` decorators
- ❌ No lifecycle hooks (ngOnInit, ngOnDestroy)
- ❌ No `ChangeDetectionStrategy.OnPush`

### Standalone Everything

All components are standalone and can be imported directly without NgModules.

### Web Components Support

Components can be exported as native web components using Angular Elements, making them framework-agnostic.

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file in this repository for instructions on how to contribute to platform-mesh.

## Code of Conduct

Please refer to our [Code of Conduct](https://github.com/openmfp/.github/blob/main/CODE_OF_CONDUCT.md)
for information on the expected conduct for contributing to openMFP.


