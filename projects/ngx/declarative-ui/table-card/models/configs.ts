import { FormFieldDefinition, FormFieldErrors } from '../../form';
import { ButtonSettings } from '../../models';
import { TableFieldDefinition } from '../../table';

/** Configuration for the create/edit resource form rendered inside the table card dialogs. */
export interface ResourceFormConfig {
  /** Ordered list of fields to render in the form. */
  fields: FormFieldDefinition[];
  /** Dialog title shown in the header. */
  title?: string;
  /** Label for the confirm/submit button. */
  confirmLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
}

/** Runtime validation and submit state passed to the table card from the host. */
export interface TableCardFormState {
  /** Map of field names to their current error messages. Any truthy error in the map disables the submit button. */
  fieldErrors?: FormFieldErrors;
}

/** Configuration for the delete-confirmation dialog. */
export interface DeleteResourceConfirmationConfig {
  /** Dialog title. */
  title?: string;
  /** Explanatory message shown below the title. */
  message?: string;
  /** Label for the confirm/delete button. */
  confirmLabel?: string;
  /** Label for the cancel button. */
  cancelLabel?: string;
}

/**
 * One entry in the {@link TableCardSearchConfig.filterTabs} strip rendered
 * above the table. Clicking a tab activates that filter; the host receives the
 * selected definition via the `filterTabChanged` output and is responsible for
 * applying the filter to its data set.
 *
 * The strip renders exactly the array of `FieldFilterDefinition` it receives
 * — no extra "All" / no-filter tab is auto-added. If the host wants such an
 * option it must author it as a regular filter entry.
 */
export interface FieldFilterDefinition {
  /** Visible label rendered as the tab text. */
  label: string;
  /** Name of the property the value applies to. Passed through to the host. */
  property: string;
  /** Value compared against `property` when the host applies the filter. */
  value: string;
  /** When `true`, this tab is selected on initial render; otherwise the first tab is. */
  default?: boolean;
}

/** Configuration for the inner `mfp-declarative-table`. */
export interface TableConfig {
  /** Column definitions. */
  fields: TableFieldDefinition[];
  /** Total number of items on the server (used by pagination). */
  totalItemsCount?: number;
  /** Page size in `pager` mode; batch size for the grow modes otherwise. */
  paginationLimit?: number;
  /** 1-based current page. Only used when `loadMode` is `'pager'`. */
  currentPage?: number;
  /** When `true`, the "Load More" control is shown. Grow modes only. */
  hasMore?: boolean;
  height?: number;
  /**
   * How additional rows are presented:
   * - `'scroll'` / `'button'` — grow the list in place via `ui5-table-growing`.
   * - `'pager'` — classic arrow pager (first/prev/next/last) emitting `pageChange`.
   */
  loadMode?: 'scroll' | 'button' | 'pager';
  /** Text on the grow "Load More" button. Grow modes only. */
  loadMoreButtonText?: string;
}

/** Overrides for the table card's built-in action buttons. */
export interface TableCardButtonSettings {
  /** Partial override for the "Create" button. */
  createButton?: Partial<ButtonSettings>;
  /** Partial override for the search toggle button. */
  searchButton?: Partial<ButtonSettings>;
  /** Partial override for the per-row "Edit" button. */
  editButton?: Partial<ButtonSettings>;
  /** Partial override for the per-row "Delete" button. */
  deleteButton?: Partial<ButtonSettings>;
}

/**
 * Groups all search/filter concerns for `<mfp-declarative-table-card>`. Passing
 * this object opts the card into showing the search input and (if `filterTabs`
 * is set) the filter-tab strip. Omit the whole object to hide both.
 *
 * `initialSearch` and `initialFilter` are **one-shot seeds** — read once when
 * the card mounts (or when they first appear) and never re-applied afterwards.
 * User-driven updates continue to flow through the `searchChanged` and
 * `filterTabChanged` outputs; the host is expected to keep its own state.
 */
export interface TableCardSearchConfig {
  /**
   * One-shot seed for the search input. Applied to the internal `searchControl`
   * on first render (or the first time `searchConfig` appears), without
   * emitting `searchChanged`. Later changes to this value have no effect.
   */
  initialSearch?: string;
  /**
   * Placeholder text shown in the always-visible search input to prompt
   * searching. Defaults to `Search` when omitted.
   */
  placeholder?: string;
  /**
   * Predefined filters rendered as a horizontal tab strip above the table.
   * Omit (or pass an empty array) to hide the strip while keeping the search
   * input visible.
   */
  filterTabs?: FieldFilterDefinition[];
  /**
   * One-shot seed for the initially selected filter tab. Must match a
   * `filterTabs` entry by `property`+`value` to take effect. When set, this
   * takes precedence over any `default: true` flag on filter entries.
   * User-driven tab changes afterwards flow through `filterTabChanged`.
   */
  initialFilter?: FieldFilterDefinition;
}

/** Top-level configuration for `<mfp-declarative-table-card>`. */
export interface TableCardConfig {
  /** Card heading. */
  header?: string;
  /** Tooltip shown on hover of the card heading. */
  headerTooltip?: string;
  /** Required table configuration. */
  tableConfig: TableConfig;
  /** Overrides for built-in toolbar and row-action buttons. */
  buttonSettings?: TableCardButtonSettings;
  /**
   * Search-and-filter configuration. When present, the card shows the search
   * input in the toolbar. Its `filterTabs` (if any) render as a strip above
   * the table. Omit the whole object to hide the search UI and filter strip.
   */
  searchConfig?: TableCardSearchConfig;
  /** When set, enables the "Create" button and create dialog. */
  createResourceFormConfig?: ResourceFormConfig;
  /** When set, enables per-row "Edit" button and edit dialog. */
  editResourceFormConfig?: ResourceFormConfig;
  /** When set, enables per-row "Delete" button and confirmation dialog. */
  deleteResourceConfirmationConfig?: DeleteResourceConfirmationConfig;
}
