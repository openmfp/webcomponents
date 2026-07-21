import { GridStackEngine } from 'gridstack/dist/gridstack-engine';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';
import { resolveResizeWidthStep } from './resize.helpers';

export class SteppedResizeGridStackEngine extends GridStackEngine {
  override moveNodeCheck(node: GridStackNode, opts: GridStackMoveOpts): boolean {
    if (opts.resizing && opts.w !== undefined) {
      const effectiveMax = this.column - (node.x ?? 0);
      opts.w = resolveResizeWidthStep(
        opts.w,
        node.maxW ?? this.column,
        this.column,
        node.minW ?? 1,
        effectiveMax,
      );
    }

    return super.moveNodeCheck(node, opts);
  }
}
