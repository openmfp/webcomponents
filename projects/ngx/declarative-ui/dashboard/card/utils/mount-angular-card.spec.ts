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
  setInput: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} {
  const setInput = vi.fn();
  const detectChanges = vi.fn();
  const componentRef = {
    setInput,
    changeDetectorRef: { detectChanges } as unknown as ChangeDetectorRef,
  };
  const clear = vi.fn();
  const vcr = {
    createComponent: vi.fn(() => componentRef),
    clear,
  } as unknown as ViewContainerRef;
  return { vcr, setInput, clear };
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
    mountAngularCard(
      makeCfg({ componentInputs: { title: 'Pods', count: 3 } }),
      vcr,
      onCleanup,
    );

    expect(setInput).toHaveBeenCalledWith('title', 'Pods');
    expect(setInput).toHaveBeenCalledWith('count', 3);
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
});
