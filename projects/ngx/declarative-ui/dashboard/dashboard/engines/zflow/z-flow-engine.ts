import type {
  CardKeyboardCommand,
  CardMoveCommand,
} from '../keyboard/keyboard.types';
import {
  getZFlowCardSpan,
  getZFlowCardSpans,
  isCardSize,
  resolveZFlowCardSize,
} from './card-size.helpers';
import {
  type ResizeDirection,
  resolveDirectionalResizeWidthStep,
  resolveResizeWidthStep,
} from './resize.helpers';
import {
  type ZFlowGridStackNode,
  applyProjectedLayout,
  finalizeEngineChange,
  getZFlowRowHeight,
  normalizeNodeOrder,
  notifyEngine,
  projectZFlowLayout,
  reorderByInsertionSlot,
  resolveDropRowFromRect,
  resolveInsertionSlotFromProjectedRect,
  resolveZFlowKeyboardInsertionSlot,
  seedNodeOrder,
  sortNodesByZFlowOrder,
  syncNodeOrderFromLayout,
} from './z-flow.helpers';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';
import { GridStackEngine } from 'gridstack/dist/gridstack-engine';

interface LayoutSnapshot {
  node: ZFlowGridStackNode;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export class ZflowGridStackEngine extends GridStackEngine {
  columnChangeListener?: (column: number) => void;

  override prepareNode(node: GridStackNode, resizing?: boolean): GridStackNode {
    this.applyCardSpan(node as ZFlowGridStackNode, this.column);
    return super.prepareNode(node, resizing);
  }

  columnChanged(prevColumn: number, column: number): this {
    if (column && prevColumn !== column) {
      const nodes = this.nodes as ZFlowGridStackNode[];
      normalizeNodeOrder(nodes);

      const snapshot = this.takeLayoutSnapshot(nodes);
      nodes.forEach((node) => {
        this.applyCardSpan(node, column);
      });
      applyProjectedLayout(
        nodes,
        projectZFlowLayout(sortNodesByZFlowOrder(nodes), column),
      );
      if (this.markLayoutChangesDirty(snapshot)) {
        notifyEngine(this);
      }
    }

    this.columnChangeListener?.(column);
    return this;
  }

  applyKeyboardCommand(id: string, command: CardKeyboardCommand): boolean {
    if (command === 'grow' || command === 'shrink') {
      return this.stepNodeWidth(id, command);
    }

    return this.moveNodeByKeyboard(id, command);
  }

  moveNodeByKeyboard(id: string, command: CardMoveCommand): boolean {
    const nodes = this.nodes as ZFlowGridStackNode[];
    const slot = resolveZFlowKeyboardInsertionSlot(
      nodes,
      id,
      command,
      this.column,
    );
    if (slot === null) return false;

    const ordered = sortNodesByZFlowOrder(nodes);
    const orderedIds = ordered
      .filter((node) => node.id)
      .map((node) => node.id as string);
    const nextOrder = reorderByInsertionSlot(orderedIds, id, slot);
    nextOrder.forEach((nodeId, index) => {
      const node = nodes.find((candidate) => candidate.id === nodeId);
      if (node) node.zFlowOrder = index;
    });

    const snapshot = this.takeLayoutSnapshot(nodes);
    applyProjectedLayout(
      nodes,
      projectZFlowLayout(sortNodesByZFlowOrder(nodes), this.column),
    );
    const changed = this.markLayoutChangesDirty(snapshot);
    if (!changed) return false;

    this.notifyAndFinalizeKeyboardChange();
    return true;
  }

  stepNodeWidth(id: string, direction: ResizeDirection): boolean {
    const nodes = this.nodes as ZFlowGridStackNode[];
    const node = nodes.find((candidate) => candidate.id === id);
    if (!node) return false;

    syncNodeOrderFromLayout(nodes);
    const target = resolveDirectionalResizeWidthStep(
      node.w ?? 1,
      direction,
      getZFlowCardSpans(this.column),
      this.column - (node.x ?? 0),
    );
    if (target === null) return false;

    return this.applyKeyboardWidth(node, target);
  }

  override moveNodeCheck(
    node: GridStackNode,
    opts: GridStackMoveOpts,
  ): boolean {
    if (opts.resizing) {
      return this.moveNodeCheckWithSteppedResize(node, opts);
    }

    if ((node as unknown as { _moving?: boolean })._moving && !opts.nested) {
      return this.moveNodeCheckWithZFlowDrag(node, opts);
    }

    return super.moveNodeCheck(node, opts);
  }

  private moveNodeCheckWithSteppedResize(
    node: GridStackNode,
    opts: GridStackMoveOpts,
  ): boolean {
    if (!node.id || opts.w === undefined)
      return super.moveNodeCheck(node, opts);

    const nodes = this.nodes as ZFlowGridStackNode[];
    const sourceNode = nodes.find((n) => n.id === node.id);
    const spans = getZFlowCardSpans(this.column);
    if (!sourceNode || !spans.length) return super.moveNodeCheck(node, opts);

    syncNodeOrderFromLayout(nodes);

    const snapshot = this.takeLayoutSnapshot(nodes);
    const nextWidth = resolveResizeWidthStep(
      opts.w,
      spans,
      this.column - (sourceNode.x ?? 0),
    );

    this.applyWidth(sourceNode, nextWidth);
    opts.w = nextWidth;
    opts.x = sourceNode.x;
    opts.y = sourceNode.y;
    opts.h = sourceNode.h;

    const ordered = sortNodesByZFlowOrder(nodes);
    const projected = projectZFlowLayout(ordered, this.column);
    applyProjectedLayout(nodes, projected);

    const changed = this.markLayoutChangesDirty(snapshot);
    if (!changed) return false;

    notifyEngine(this);
    return true;
  }

  private applyKeyboardWidth(node: ZFlowGridStackNode, width: number): boolean {
    const nodes = this.nodes as ZFlowGridStackNode[];
    const snapshot = this.takeLayoutSnapshot(nodes);
    this.applyWidth(node, width);
    applyProjectedLayout(
      nodes,
      projectZFlowLayout(sortNodesByZFlowOrder(nodes), this.column),
    );
    const changed = this.markLayoutChangesDirty(snapshot);
    if (!changed) return false;

    this.notifyAndFinalizeKeyboardChange();
    return true;
  }

  private applyWidth(node: ZFlowGridStackNode, width: number): void {
    node.w = width;
    node.size = resolveZFlowCardSize(width, this.column, node.size);
  }

  private applyCardSpan(node: ZFlowGridStackNode, column: number): void {
    if (!isCardSize(node.size)) return;

    const span = getZFlowCardSpan(node.size, column);
    if (span !== undefined) node.w = span;
  }

  private notifyAndFinalizeKeyboardChange(): void {
    notifyEngine(this);
    finalizeEngineChange(this);
  }

  commitZFlowLayout(): boolean {
    const nodes = this.nodes as ZFlowGridStackNode[];
    normalizeNodeOrder(nodes);

    const snapshot = this.takeLayoutSnapshot(nodes);
    const ordered = sortNodesByZFlowOrder(nodes);
    const projected = projectZFlowLayout(ordered, this.column);
    applyProjectedLayout(nodes, projected);

    const changed = this.markLayoutChangesDirty(snapshot);
    if (!changed) return false;

    notifyEngine(this);
    return true;
  }

  syncZFlowOrderFromLayout(): void {
    syncNodeOrderFromLayout(this.nodes as ZFlowGridStackNode[]);
  }

  moveNodesToFront(ids: string[]): void {
    const nodes = this.nodes as ZFlowGridStackNode[];
    const front = ids
      .map((id) => nodes.find((node) => node.id === id))
      .filter((node): node is ZFlowGridStackNode => !!node);
    const rest = sortNodesByZFlowOrder(
      nodes.filter((node) => !front.includes(node)),
    );
    [...front, ...rest].forEach((node, index) => {
      node.zFlowOrder = index;
    });
  }

  private takeLayoutSnapshot(nodes: ZFlowGridStackNode[]): LayoutSnapshot[] {
    return nodes.map((n) => ({
      node: n,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
    }));
  }

  private markLayoutChangesDirty(snapshot: LayoutSnapshot[]): boolean {
    let changed = false;

    for (const { node, x, y, w, h } of snapshot) {
      if (node.x === x && node.y === y && node.w === w && node.h === h) {
        continue;
      }

      (node as unknown as { _dirty: boolean })._dirty = true;
      changed = true;
    }

    return changed;
  }

  private moveNodeCheckWithZFlowDrag(
    node: GridStackNode,
    opts: GridStackMoveOpts,
  ): boolean {
    if (!node.id) return super.moveNodeCheck(node, opts);

    const nodes = this.nodes as ZFlowGridStackNode[];
    seedNodeOrder(nodes);

    const ordered = sortNodesByZFlowOrder(nodes);
    const orderedIds = ordered.filter((n) => n.id).map((n) => n.id as string);

    const rect = opts.rect;
    const cellWidth = opts.cellWidth ?? 1;
    const cellHeight = opts.cellHeight ?? 60;
    const rowHeight = getZFlowRowHeight(ordered);
    const rowHeightPx = rowHeight * cellHeight;

    const projected = projectZFlowLayout(ordered, this.column);
    const rowCount =
      projected.length > 0 ? Math.max(...projected.map((p) => p.row)) + 1 : 1;

    const sourceNode = nodes.find((n) => n.id === node.id) as
      ZFlowGridStackNode | undefined;
    const sourceProjected = projected.find((p) => p.id === node.id);
    const previousRow = sourceProjected?.row ?? 0;

    let targetRow: number;
    if (rect) {
      const rectTop = (rect as unknown as { top?: number }).top ?? rect.y ?? 0;
      const rectHeight =
        (rect as unknown as { height?: number }).height ??
        rect.h ??
        rowHeightPx;
      targetRow = resolveDropRowFromRect(
        rectTop,
        rectHeight,
        rowHeightPx,
        rowCount,
        previousRow,
      );
    } else {
      targetRow = Math.floor((opts.y ?? sourceNode?.y ?? 0) / rowHeight);
    }

    targetRow = Math.max(0, Math.min(targetRow, rowCount - 1));

    const rowNodes = projected
      .filter((p) => p.row === targetRow)
      .map((p) => ({ id: p.id, x: p.x, w: p.w }));

    const idsWithoutSource = orderedIds.filter((id) => id !== node.id);
    let absoluteSlot: number;

    if (rect) {
      const rectLeft =
        (rect as unknown as { left?: number }).left ?? rect.x ?? 0;
      const rectTop = (rect as unknown as { top?: number }).top ?? rect.y ?? 0;
      const rectWidth =
        (rect as unknown as { width?: number }).width ?? rect.w ?? cellWidth;
      const rectHeight =
        (rect as unknown as { height?: number }).height ??
        rect.h ??
        rowHeightPx;
      absoluteSlot = resolveInsertionSlotFromProjectedRect(
        ordered,
        node.id as string,
        this.column,
        {
          leftPx: rectLeft,
          topPx: rectTop,
          widthPx: rectWidth,
          heightPx: rectHeight,
        },
        cellWidth,
        cellHeight,
        orderedIds.indexOf(node.id as string),
      );
    } else {
      const targetX = opts.x ?? sourceNode?.x ?? 0;
      const insertionSlotInRow = rowNodes.filter((n) => {
        const proj = projected.find((p) => p.id === n.id);
        return proj && proj.x <= targetX && n.id !== node.id;
      }).length;

      const rowIdsWithoutSource = rowNodes
        .filter((n) => n.id && n.id !== node.id)
        .map((n) => n.id as string);

      if (rowIdsWithoutSource.length === 0) {
        absoluteSlot = orderedIds.indexOf(node.id as string);
      } else {
        const firstRowIdxInFull = idsWithoutSource.indexOf(
          rowIdsWithoutSource[0],
        );
        absoluteSlot = firstRowIdxInFull + insertionSlotInRow;
      }
    }

    absoluteSlot = Math.max(0, Math.min(absoluteSlot, idsWithoutSource.length));

    const newOrderedIds = reorderByInsertionSlot(
      orderedIds,
      node.id as string,
      absoluteSlot,
    );
    const orderChanged = newOrderedIds.some((id, i) => id !== orderedIds[i]);
    if (!orderChanged) return false;

    newOrderedIds.forEach((id, idx) => {
      const n = nodes.find((nn) => nn.id === id);
      if (n) n.zFlowOrder = idx;
    });

    const projectedLayout = projectZFlowLayout(
      sortNodesByZFlowOrder(nodes),
      this.column,
    );

    applyProjectedLayout(nodes, projectedLayout);
    notifyEngine(this);

    return true;
  }
}
