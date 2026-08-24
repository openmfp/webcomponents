# Test ID Naming Convention

All interactive and identifiable elements across the webcomponents library carry a `data-testid` attribute. This document defines the naming convention, explains how dynamic IDs are constructed, and lists every stable test ID by component.

---

## Convention rules

- **Format:** kebab-case strings only — `dashboard-save-btn`, not `dashboardSaveBtn` or `dashboard_save_btn`.
- **Prefix:** each component owns a namespace prefix that matches its tag name without the `mfp-` scope — `generic-table-card-*`, `dashboard-*`, etc.
- **Static IDs** describe purpose, not appearance: `dashboard-save-btn` instead of `dashboard-green-button`.
- **Dynamic IDs** embed a runtime value (index, field name, card ID) separated by `-`. The pattern is always `{prefix}-{runtime-value}` or `{prefix}-{runtime-value}-{suffix}`.
- **Mutually exclusive branches** may share an ID string (e.g. `dashboard-edit-view-btn` in both `editButtonFirst` branches) because only one is rendered at a time — a single `getByTestId` call always resolves to exactly one element.
- **Angular `@Input testId`** — sub-components that accept a `testId` input render it as `data-testid` on their root element. The parent passes a derived value (`testId() + '-secret'`, etc.) so the resulting attribute follows the same `{prefix}-{suffix}` pattern.

---

## Component test IDs

### DeclarativeTableCard (`generic-table-card-*`)

| Element        | `data-testid`                       | Notes                                                  |
| -------------- | ----------------------------------- | ------------------------------------------------------ |
| Card root      | `generic-table-card`                | Static                                                 |
| Search button  | `generic-table-card-search-btn`     | Present when `config.resourcesSearchable` is true      |
| Search input   | `generic-table-card-search-input`   | Present when search is expanded                        |
| Create button  | `generic-table-card-create-btn`     | Present when `createResourceFormConfig` is set         |
| Create dialog  | `generic-table-card-create-dialog`  |                                                        |
| Create confirm | `generic-table-card-create-confirm` |                                                        |
| Create cancel  | `generic-table-card-create-cancel`  |                                                        |
| Edit dialog    | `generic-table-card-edit-dialog`    | Present when `editResourceFormConfig` is set           |
| Edit confirm   | `generic-table-card-edit-confirm`   |                                                        |
| Edit cancel    | `generic-table-card-edit-cancel`    |                                                        |
| Delete dialog  | `generic-table-card-delete-dialog`  | Present when `deleteResourceConfirmationConfig` is set |
| Delete confirm | `generic-table-card-delete-confirm` |                                                        |
| Delete cancel  | `generic-table-card-delete-cancel`  |                                                        |

---

### DeclarativeTable (`generic-table-*`)

| Element          | `data-testid`                               | Notes                                  |
| ---------------- | ------------------------------------------- | -------------------------------------- |
| Table element    | `generic-table`                             | Static                                 |
| Header cell      | `generic-table-header-{column}`             | `column` = `group.name` or `property`  |
| Table row        | `generic-table-row-{i}`                     | `i` = 0-based row index                |
| Cell (simple)    | `generic-table-cell-{i}-{property}`         | `property` = column `property` field   |
| Cell (group)     | `generic-table-cell-{i}-{group}`            | `group` = `group.name`                 |
| Group sub-value  | `generic-table-cell-{i}-{group}-{property}` | Nested field inside a grouped column   |
| No-data state    | `generic-table-view-nodata`                 | Shown when `resources` is empty        |
| Loading state    | `generic-table-view-loading`                | Shown instead of no-data while loading |
| Error state      | `generic-table-view-error`                  | Shown when `error` is true             |
| Retry button     | `generic-table-retry`                       | Shown inside the error state           |
| Load-more        | `generic-table-growing`                     | Shown when `hasMore` is true           |
| Page-size select | `generic-table-pagination-select`           | Always present                         |

---

### DeclarativeForm (`generic-form-*`)

| Element         | `data-testid`                              | Notes                                                        |
| --------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Form element    | `generic-form`                             | Static                                                       |
| Field container | `generic-form-field-container-{name}`      | `name` = `field.name` (dot notation, e.g. `metadata.name`)   |
| Field label     | `generic-form-field-label-{name}`          |                                                              |
| Input or select | `generic-form-field-{name}`                | `<ui5-input>` or `<ui5-select>` depending on `field.values`  |
| Select option   | `generic-form-field-{name}-option-{value}` | `value` = option string or `empty` for the blank placeholder |

---

### Dashboard (`dashboard-*`)

#### Main component

| Element                   | `data-testid`                | Notes                                                                               |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| Root container            | `dashboard`                  | Static                                                                              |
| Title                     | `dashboard-title`            | Present when `config.title` is set                                                  |
| Description               | `dashboard-description`      | Present when `config.description` is set                                            |
| Edit-cards button         | `dashboard-edit-cards-btn`   | Visible in edit mode                                                                |
| Compact menu toggle       | `dashboard-toolbar-menu-btn` | Visible in compact toolbar mode                                                     |
| Compact dropdown menu     | `dashboard-toolbar-menu`     |                                                                                     |
| Edit-view menu item       | `dashboard-action-edit-view` | Inside compact menu when `config.editable` is true                                  |
| Custom action (menu item) | `dashboard-action-{action}`  | `action` = `customAction.action`; in compact menu                                   |
| Custom action (button)    | `dashboard-action-{action}`  | Same value, rendered as `<ui5-button>` in full toolbar                              |
| Edit-view button          | `dashboard-edit-view-btn`    | Full toolbar; appears before or after custom actions depending on `editButtonFirst` |
| Grid                      | `dashboard-grid`             | The gridstack container                                                             |
| Save button               | `dashboard-save-btn`         | Visible in edit mode                                                                |
| Cancel button             | `dashboard-cancel-btn`       | Visible in edit mode                                                                |

#### DashboardCard

| Element       | `data-testid`                | Notes                                                       |
| ------------- | ---------------------------- | ----------------------------------------------------------- |
| Card root     | `dashboard-card-{id}`        | `id` = `card.id`; both `component-card` and `card` branches |
| Remove button | `dashboard-card-{id}-remove` | Visible in edit mode                                        |

#### DashboardSection

| Element       | `data-testid`                   | Notes                                                  |
| ------------- | ------------------------------- | ------------------------------------------------------ |
| Section root  | `dashboard-section-{id}`        | `id` = `section.id`                                    |
| Remove button | `dashboard-section-{id}-remove` | Visible in edit mode when `section.editable !== false` |
| Section title | `dashboard-section-{id}-title`  | Present when `section.title` is set                    |

#### EditCardsDialog

| Element       | `data-testid`                      | Notes                     |
| ------------- | ---------------------------------- | ------------------------- |
| Dialog        | `dashboard-edit-cards-dialog`      |                           |
| Card row      | `dashboard-edit-cards-row-{id}`    | `id` = `availableCard.id` |
| Toggle switch | `dashboard-edit-cards-switch-{id}` |                           |
| Save button   | `dashboard-edit-cards-save-btn`    |                           |
| Cancel button | `dashboard-edit-cards-cancel-btn`  |                           |

#### DiscardChangesDialog

| Element                  | `data-testid`                           | Notes |
| ------------------------ | --------------------------------------- | ----- |
| Dialog                   | `dashboard-discard-changes-dialog`      |       |
| Confirm (Discard) button | `dashboard-discard-changes-confirm-btn` |       |
| Cancel button            | `dashboard-discard-changes-cancel-btn`  |       |

#### UnsavedChangesDialog

| Element        | `data-testid`                           | Notes |
| -------------- | --------------------------------------- | ----- |
| Dialog         | `dashboard-unsaved-changes-dialog`      |       |
| Save button    | `dashboard-unsaved-changes-save-btn`    |       |
| Discard button | `dashboard-unsaved-changes-discard-btn` |       |
| Cancel button  | `dashboard-unsaved-changes-cancel-btn`  |       |

---

### ResourceField (`resource-field-*`)

`ResourceField` derives its test ID from `fieldDefinition.property` at runtime:

```
data-testid = "resource-field-{property}"
```

Sub-elements follow a consistent suffix pattern:

| Element          | `data-testid`                             | Condition                                                 |
| ---------------- | ----------------------------------------- | --------------------------------------------------------- |
| Root span        | `resource-field-{property}`               | Always                                                    |
| Secret value     | `resource-field-{property}-secret`        | `displayAs: 'secret'`                                     |
| Show/hide toggle | `resource-field-{property}-secret-toggle` | `displayAs: 'secret'`                                     |
| Boolean icon     | `resource-field-{property}-boolean`       | `displayAs: 'boolIcon'` and value is `"true"` / `"false"` |
| Link             | `resource-field-{property}-link`          | `displayAs: 'link'` and value is a valid URL              |
| Tooltip icon     | `resource-field-{property}-tooltip`       | `displayAs: 'tooltip'`                                    |
| Alert icon       | `resource-field-{property}-icon`          | `displayAs: 'alert'` and value is falsy                   |
| Action button    | `resource-field-{property}-button`        | `displayAs: 'button'`                                     |
| Copy icon        | `resource-field-{property}-copy`          | `uiSettings.withCopyButton: true`                         |
| Tag list         | `resource-field-{property}-tags`          | `displayAs: 'tag'`                                        |

**Example** — a field `{ property: 'status.ready', uiSettings: { displayAs: 'boolIcon' } }` on a resource where the value is `"true"` produces:

```html
<span data-testid="resource-field-status.ready">
  <!-- mfp-boolean-value renders: -->
  <ui5-icon data-testid="resource-field-status.ready-boolean" ... />
</span>
```

---

## Adding test IDs to new components

When contributing a new component:

1. Pick a namespace prefix that matches the component's tag (without `mfp-`).
2. Add `data-testid` to every interactive element (buttons, inputs, selects, links, dialogs) and every major container that E2E tests would use as an anchor.
3. Use `[attr.data-testid]` for dynamic values and plain `data-testid="..."` for static ones.
4. Document the test IDs in the component's `docs/` file under a `## Test IDs` section, following the table format used in this guide.
5. Add the new IDs to the table in this file.
