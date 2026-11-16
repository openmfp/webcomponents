import type { ActionsHook } from './data-fetch.model';
import type { ErrorHandler } from '@angular/core';

export function runActionsHook(
  hook: ActionsHook | undefined,
  key: string,
  errorHandler: ErrorHandler,
): void {
  if (!hook) return;
  try {
    Promise.resolve(hook(key)).catch((error: unknown) => {
      errorHandler.handleError(error);
    });
  } catch (error) {
    errorHandler.handleError(error);
  }
}
