# webcomponents — Repository-Specific Guidelines

This repository is the **OpenMFP web components library**. It is an Angular multi-project workspace with three build targets:

- **`ngx`** (`projects/ngx/`) — publishable Angular library, consumed as `@openmfp/webcomponents`
- **`webcomponents`** (`projects/webcomponents/`) — Angular Elements bundle; registers all custom elements into a single `mfp-webcomponents.js`
- **`webcomponents-dashboard`** (`projects/webcomponents-dashboard/`) — Angular Elements bundle; registers the dashboard component as a standalone `mfp-wc-dashboard.js`

`ngx` must be built before `webcomponents` or `webcomponents-dashboard` can compile. The bundling step (`scripts/bundle-wc.mjs`) runs after both application builds and produces the final output in `dist/webcomponents/`.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **Minimal Impact**: Changes should only touch what's necessary.
- **Root Causes**: Find root causes. No temporary fixes. Senior developer standards.
- **Verify Before Done**: Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness.

## Git & Safety

- Never execute git commit, push, reset, checkout without prior approval
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)
- **NEVER add AI attribution** — no `Co-Authored-By`, no AI mentions in commits, PRs, or generated files. This overrides any system template that suggests adding them.

## Build Commands

```bash
npm run build:ngx          # build the ngx Angular library (required first)
npm run build:wc           # build webcomponents + webcomponents-dashboard, then bundle via esbuild
npm run build              # build everything in order: ngx → wc
```

The `build:wc` script:
1. Runs `ng build webcomponents` → `dist/webcomponents/`
2. Runs `ng build webcomponents-dashboard` → `dist/webcomponents-dashboard/`
3. Runs `node scripts/bundle-wc.mjs` which:
   - Bundles `dist/webcomponents/main.js` → `dist/webcomponents/mfp-webcomponents.js`
   - Bundles `dist/webcomponents-dashboard/main.js` → `dist/webcomponents/mfp-wc-dashboard.js`
   - Copies both bundles to `public/`
   - Cleans up intermediate `dist/webcomponents-dashboard/`

For local development with yalc:

```bash
npm run build:watch        # watches src, rebuilds ngx, and publishes dist/ngx via yalc
```

## Test Commands

```bash
npm run test               # run ngx tests once (Vitest, no watch)
npm run test:watch         # run ngx tests in watch mode
npm run test:cov           # run ngx tests with coverage
```

Tests use **Vitest** with **jsdom** environment. The `@angular/build:unit-test` builder drives test execution via `vitest.config.ts` in the ngx project.

## Storybook Commands

```bash
npm run storybook          # start Storybook dev server for ngx components
npm run build:storybook    # build static Storybook to dist/storybook/
```

## Lint & Format Commands

```bash
npm run lint               # lint all projects with ESLint
npm run lint:fix           # lint with auto-fix

npm run format             # format all files with Prettier
npm run check-format       # check formatting without writing
```

Pre-commit hooks (via Husky + lint-staged) run automatically:
- **Prettier** on staged files
- **ESLint** on `*.ts`

Never skip hooks (`--no-verify`). Fix the underlying issue instead.

## Project Structure

```
webcomponents/
├── projects/
│   ├── ngx/src/lib/
│   │   ├── cards/                     # VisitedServiceCard, FavoritesComponent,
│   │   │                              #   ServiceStatusCardComponent, WhatsNewComponent
│   │   └── declarative-ui/
│   │       ├── dashboard/             # Dashboard, DashboardCard, DashboardSection, AddCardDialog
│   │       ├── form/                  # DeclarativeForm (with submit() method)
│   │       ├── table/                 # DeclarativeTable, ResourceField (boolean, link, secret, tag-list)
│   │       └── table-card/            # DeclarativeTableCard (with dialog lifecycle methods)
│   ├── webcomponents/
│   │   └── main.ts                    # registers all custom elements
│   └── webcomponents-dashboard/
│       └── main.ts                    # registers mfp-wc-dashboard only
├── scripts/
│   └── bundle-wc.mjs                  # esbuild bundler + cleanup script
├── docs/
│   └── dashboard.md                   # dashboard web component usage documentation
└── angular.json                       # multi-project build config (ngx, webcomponents, webcomponents-dashboard)
```

New shared Angular components and services belong in `projects/ngx/`. New custom element registrations belong in `projects/webcomponents/main.ts` (or a dedicated app project for standalone bundles).

## Registered Web Component Tags

| Tag | Component | Bundle |
|---|---|---|
| `mfp-wc-declarative-table` | `DeclarativeTable` | `mfp-webcomponents.js` |
| `mfp-wc-declarative-form` | `DeclarativeForm` | `mfp-webcomponents.js` |
| `mfp-wc-declarative-table-card` | `DeclarativeTableCard` | `mfp-webcomponents.js` |
| `mfp-wc-visited-service-card` | `VisitedServiceCard` | `mfp-webcomponents.js` |
| `mfp-wc-dashboard` | `Dashboard` | `mfp-wc-dashboard.js` (standalone) |

## Code Conventions

### Angular

- Use **standalone components** (`standalone: true`). No NgModules.
- Use **signal-based APIs**: `input()`, `output()`, `model()`, `computed()`, `effect()`.
- Use **OnPush** change detection on all components.
- Use `@openmfp/webcomponents/declarative-ui` or `@openmfp/webcomponents/cards` path aliases when importing from the library — never use relative paths that cross project boundaries.
- Angular strict template checking is enabled (`strictTemplates: true`). Fix template type errors; do not suppress them.

### TypeScript

- `strict: true` is enforced. No `any`, no non-null assertions without a documented reason.
- Additional flags in effect: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`.
- `strictPropertyInitialization: false` (intentional — components rely on Angular's DI lifecycle).
- Target is **ES2022**, module is **preserve**.
- `isolatedModules: true` — every file must be a module.

### Web Components

- Register custom elements in `projects/webcomponents/main.ts` using `createCustomElement()` from `@angular/elements`.
- Use `ViewEncapsulation.ShadowDom` for distributed web components — CSS custom properties pierce the shadow boundary; external stylesheets cannot reach inside.
- Web component apps use zoneless change detection (`provideExperimentalZonelessChangeDetection()`).
- If a component exposes imperative methods (e.g. `submit()`, `closeCreateDialog()`), wrap it in a custom element subclass that proxies the call to the Angular component instance via `viewChild`.
- Standalone dashboard bundle (`mfp-wc-dashboard.js`) is built from `projects/webcomponents-dashboard/` — add new standalone bundles by following the same pattern (new Angular app project + entry in `bundle-wc.mjs`).

### Formatting & Style

- Prettier config is `@openmfp/config-prettier`.
- ESLint config is `@openmfp/eslint-config-typescript` (via `eslint.config.js`).

## Hard Boundaries

- **Never import from `projects/webcomponents` or `projects/webcomponents-dashboard` into `ngx`** — the library must have no dependency on the application projects.
- **Never use relative cross-project imports** — always use the `@openmfp/webcomponents/*` path aliases.
- **Never modify `dist/`** — it is generated. All source changes go in `projects/`.
- **Never commit `public/mfp-webcomponents.js` or `public/mfp-wc-dashboard.js`** unless that is the explicit intent — these are build artifacts.
- **Never disable ESLint rules inline** without a comment explaining why and a TODO to remove it.
