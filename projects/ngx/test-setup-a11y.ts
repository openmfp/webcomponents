import ListItem from '@ui5/webcomponents/dist/ListItem.js';
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

// jsdom ships no ResizeObserver; components that measure their own layout
// construct one, so provide an inert stand-in that never fires.
if (!('ResizeObserver' in globalThis)) {
  const noop = (): void => undefined;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
  };
}

// jsdom never gives a UI5 list item a focus DOM ref, so UI5's
// `getTabbableElements(undefined)` throws while a list computes its aria
// description. That exception escapes mid-render and leaves promises awaiting
// the render — `setLanguage()` among them — permanently unsettled. Treat an
// item with no focus DOM ref as having no focusable elements.
interface FocusableListItem {
  getFocusDomRef(): HTMLElement | undefined;
  _getFocusableElements(): HTMLElement[];
}
const listItemProto = ListItem.prototype as unknown as FocusableListItem;
const getFocusableElements = listItemProto._getFocusableElements;
listItemProto._getFocusableElements = function (
  this: FocusableListItem,
): HTMLElement[] {
  return this.getFocusDomRef() ? getFocusableElements.call(this) : [];
};
