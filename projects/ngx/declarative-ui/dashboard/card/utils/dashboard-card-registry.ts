import {
  Type,
  isDevMode,
  isStandalone,
  reflectComponentType,
} from '@angular/core';

export interface RegisteredDashboardCardComponent {
  componentType: Type<unknown>;
  selector: string;
  inputs: ReadonlyMap<string, string>;
}

const ELEMENT_SELECTOR_PATTERN = /^[a-z](?:[a-z0-9-]*)$/;

const dashboardCardRegistry = new Map<
  string,
  RegisteredDashboardCardComponent
>();

export function addComponentToRegistry(componentTypes: Type<unknown>[]): void {
  for (const componentType of componentTypes) {
    const mirror = reflectComponentType(componentType);

    if (!mirror) {
      throw new Error(
        `Dashboard card registration failed: "${getTypeName(componentType)}" is not an Angular component.`,
      );
    }

    if (!isStandalone(componentType)) {
      throw new Error(
        `Dashboard card registration failed: "${mirror.selector}" must be a standalone Angular component.`,
      );
    }

    const selector = toElementSelector(mirror.selector, componentType);
    const existing = dashboardCardRegistry.get(selector);

    if (existing && existing.componentType !== componentType) {
      throw new Error(
        `Dashboard card registration failed: selector "${selector}" is already registered.`,
      );
    }

    dashboardCardRegistry.set(selector, {
      componentType,
      selector,
      inputs: createInputMap(mirror.inputs),
    });
  }
}

export function getRegisteredDashboardCardComponent(
  selector: string,
): RegisteredDashboardCardComponent | undefined {
  return dashboardCardRegistry.get(selector);
}

export function resetDashboardCardRegistry(): void {
  dashboardCardRegistry.clear();
}

export function warnForUnknownDashboardCardInput(
  selector: string,
  inputName: string,
): void {
  if (!isDevMode()) return;

  console.warn(
    `Dashboard card "${selector}" ignores unknown Angular input "${inputName}".`,
  );
}

function createInputMap(
  inputs: readonly {
    readonly propName: string;
    readonly templateName: string;
  }[],
): ReadonlyMap<string, string> {
  const bindings = new Map<string, string>();

  for (const input of inputs) {
    bindings.set(input.templateName, input.templateName);
    bindings.set(input.propName, input.templateName);
  }

  return bindings;
}

function toElementSelector(
  selector: string,
  componentType: Type<unknown>,
): string {
  const normalized = selector.trim();

  if (!ELEMENT_SELECTOR_PATTERN.test(normalized)) {
    throw new Error(
      `Dashboard card registration failed: "${getTypeName(componentType)}" must use a single element selector. Received "${selector}".`,
    );
  }

  return normalized;
}

function getTypeName(componentType: Type<unknown>): string {
  return componentType.name.replace(/^_+/, '') || 'AnonymousComponent';
}
