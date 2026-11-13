import type { AfterRequestHook } from '../../../data-fetch-table';
import { CardConfig } from '../../models';
import {
  addComponentToRegistry,
  resetDashboardCardRegistry,
} from './dashboard-card-registry';
import { mountAngularCard } from './mount-angular-card';
import {
  ChangeDetectorRef,
  Component,
  EffectCleanupRegisterFn,
  ViewContainerRef,
  input,
} from '@angular/core';

@Component({
  selector: 'mfp-test-angular-card',
  standalone: true,
  template: '<span>angular card</span>',
})
class TestAngularCard {
  title = input<string>();
  count = input<number>();
  afterRequestHook = input<AfterRequestHook>();
}

@Component({
  selector: 'mfp-test-sizing-card',
  standalone: true,
  template: '<span>sizing card</span>',
})
class TestSizingCard {
  contentHeight = input<number | undefined>(undefined);
}

function makeCleanup(): {
  onCleanup: EffectCleanupRegisterFn;
  runCleanup: () => void;
} {
  let registered: (() => void) | undefined;
  return {
    onCleanup: (fn) => {
      registered = fn;
    },
    runCleanup: () => registered?.(),
  };
}

function makeMockVcr(): {
  vcr: ViewContainerRef;
  instance: object;
  setInput: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} {
  const setInput = vi.fn();
  const detectChanges = vi.fn();
  const componentRef = {
    instance: { onCardAction: vi.fn() },
    setInput,
    changeDetectorRef: { detectChanges } as unknown as ChangeDetectorRef,
  };
  const clear = vi.fn();
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientHeight', {
    configurable: true,
    value: 260,
  });
  const vcr = {
    createComponent: vi.fn(() => componentRef),
    element: { nativeElement: host },
    clear,
  } as unknown as ViewContainerRef;
  return { vcr, instance: componentRef.instance, setInput, clear };
}

function makeCfg(overrides: Partial<CardConfig> = {}): CardConfig {
  return {
    id: 'card-1',
    component: 'mfp-test-angular-card',
    type: 'angular',
    ...overrides,
  };
}

describe('mountAngularCard', () => {
  beforeEach(() => {
    resetDashboardCardRegistry();
    addComponentToRegistry([TestAngularCard]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetDashboardCardRegistry();
  });

  it('creates the registered Angular component in the host', () => {
    const { vcr } = makeMockVcr();
    const { onCleanup } = makeCleanup();
    mountAngularCard(makeCfg(), vcr, onCleanup);

    expect(
      vcr.createComponent as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(TestAngularCard);
  });

  it('calls setInput for each provided componentInput', () => {
    const { vcr, setInput } = makeMockVcr();
    const { onCleanup } = makeCleanup();
    const cardHook = vi.fn<AfterRequestHook>();
    const dashboardHook = vi.fn<AfterRequestHook>();
    mountAngularCard(
      makeCfg({
        componentInputs: {
          title: 'Pods',
          count: 3,
          afterRequestHook: cardHook,
        },
      }),
      vcr,
      onCleanup,
      undefined,
      undefined,
      dashboardHook,
    );

    expect(setInput).toHaveBeenCalledWith('title', 'Pods');
    expect(setInput).toHaveBeenCalledWith('count', 3);
    expect(setInput).toHaveBeenLastCalledWith(
      'afterRequestHook',
      dashboardHook,
    );
  });

  it('warns and skips unknown inputs in dev mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    const { vcr, setInput } = makeMockVcr();
    const { onCleanup } = makeCleanup();

    mountAngularCard(
      makeCfg({ componentInputs: { unknownProp: 'x' } }),
      vcr,
      onCleanup,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknownProp'),
    );
    expect(setInput).not.toHaveBeenCalled();
  });

  it('skips the response hook for an Angular component without the input', () => {
    addComponentToRegistry([TestSizingCard]);
    const { vcr, setInput } = makeMockVcr();
    const { onCleanup, runCleanup } = makeCleanup();
    mountAngularCard(
      makeCfg({ component: 'mfp-test-sizing-card' }),
      vcr,
      onCleanup,
      undefined,
      undefined,
      vi.fn(),
    );
    expect(setInput).not.toHaveBeenCalledWith(
      'afterRequestHook',
      expect.anything(),
    );
    runCleanup();
  });

  it('reports the component instance through onMounted', () => {
    const { vcr, instance } = makeMockVcr();
    const { onCleanup } = makeCleanup();
    const onMounted = vi.fn();

    mountAngularCard(makeCfg(), vcr, onCleanup, onMounted);

    expect(onMounted).toHaveBeenCalledWith(instance);
  });

  it('clears the host on cleanup', () => {
    const { vcr, clear } = makeMockVcr();
    const { onCleanup, runCleanup } = makeCleanup();
    mountAngularCard(makeCfg(), vcr, onCleanup);

    runCleanup();

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('warns and returns without creating a component when selector is not registered', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    const { vcr } = makeMockVcr();
    const { onCleanup } = makeCleanup();

    mountAngularCard(makeCfg({ component: 'unknown-card' }), vcr, onCleanup);

    expect(
      vcr.createComponent as ReturnType<typeof vi.fn>,
    ).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"unknown-card" is not registered'),
    );
  });

  describe('contentHeight', () => {
    it('hands the slot height to a card that declares the input', () => {
      addComponentToRegistry([TestSizingCard]);
      const { vcr, setInput } = makeMockVcr();
      const { onCleanup } = makeCleanup();

      mountAngularCard(
        makeCfg({ component: 'mfp-test-sizing-card' }),
        vcr,
        onCleanup,
      );

      expect(setInput).toHaveBeenCalledWith('contentHeight', 260);
    });

    it('leaves a card that does not declare the input untouched', () => {
      const { vcr, setInput } = makeMockVcr();
      const { onCleanup } = makeCleanup();

      mountAngularCard(makeCfg(), vcr, onCleanup);

      expect(setInput).not.toHaveBeenCalledWith(
        'contentHeight',
        expect.anything(),
      );
    });

    it('stops observing the slot once the card is torn down', () => {
      const disconnect = vi.fn();
      const original = globalThis.ResizeObserver;
      const noop = (): void => undefined;
      globalThis.ResizeObserver = class {
        observe = noop;
        unobserve = noop;
        disconnect = disconnect;
      } as unknown as typeof ResizeObserver;
      addComponentToRegistry([TestSizingCard]);
      const { vcr } = makeMockVcr();
      const { onCleanup, runCleanup } = makeCleanup();

      mountAngularCard(
        makeCfg({ component: 'mfp-test-sizing-card' }),
        vcr,
        onCleanup,
      );
      runCleanup();

      globalThis.ResizeObserver = original;
      expect(disconnect).toHaveBeenCalled();
    });
  });
});
