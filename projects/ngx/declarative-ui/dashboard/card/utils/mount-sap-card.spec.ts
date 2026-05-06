import { EffectCleanupRegisterFn } from '@angular/core';
import { mountSapCard } from './mount-sap-card';
import { CardConfig } from '../../models';

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

function makeHost(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function makeCfg(overrides: Partial<CardConfig> = {}): CardConfig {
  return { id: 'card-1', component: 'my.sap.App', type: 'sap-ui', ...overrides };
}

describe('mountSapCard', () => {
  let placeAt: ReturnType<typeof vi.fn>;
  let destroy: ReturnType<typeof vi.fn>;
  let ComponentContainer: ReturnType<typeof vi.fn>;
  let sapRequire: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    placeAt = vi.fn();
    destroy = vi.fn();
    ComponentContainer = vi.fn(function (this: Record<string, unknown>) {
      this['placeAt'] = placeAt;
      this['destroy'] = destroy;
    });
    sapRequire = vi
      .fn()
      .mockImplementation((_deps: unknown, cb: (ctor: unknown) => void) => {
        cb(ComponentContainer);
      });

    (window as unknown as Record<string, unknown>)['sap'] = {
      ui: { require: sapRequire },
    };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['sap'];
    vi.restoreAllMocks();
  });

  it('calls sap.ui.require with ComponentContainer dependency', () => {
    const { onCleanup } = makeCleanup();
    mountSapCard(makeCfg(), makeHost(), onCleanup);

    expect(sapRequire).toHaveBeenCalledWith(
      ['sap/ui/core/ComponentContainer'],
      expect.any(Function),
    );
  });

  it('instantiates ComponentContainer with the correct config', () => {
    const { onCleanup } = makeCleanup();
    mountSapCard(
      makeCfg({ componentInputs: { env: 'prod' } }),
      makeHost(),
      onCleanup,
    );

    expect(ComponentContainer).toHaveBeenCalledWith({
      name: 'my.sap.App',
      manifest: true,
      async: true,
      settings: { env: 'prod' },
    });
  });

  it('falls back to empty settings when componentInputs is omitted', () => {
    const { onCleanup } = makeCleanup();
    mountSapCard(makeCfg(), makeHost(), onCleanup);

    expect(ComponentContainer).toHaveBeenCalledWith(
      expect.objectContaining({ settings: {} }),
    );
  });

  it('calls placeAt with the host element', () => {
    const { onCleanup } = makeCleanup();
    const host = makeHost();
    mountSapCard(makeCfg(), host, onCleanup);

    expect(placeAt).toHaveBeenCalledWith(host);
  });

  it('destroys the container and clears the host on cleanup', () => {
    const { onCleanup, runCleanup } = makeCleanup();
    const host = makeHost();
    host.innerHTML = '<span>old</span>';
    mountSapCard(makeCfg(), host, onCleanup);

    runCleanup();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(host.innerHTML).toBe('');
  });

  it('does not mount the container when cleanup runs before the require callback fires', () => {
    let deferred: ((ctor: unknown) => void) | undefined;
    sapRequire.mockImplementationOnce(
      (_deps: unknown, cb: (ctor: unknown) => void) => {
        deferred = cb;
      },
    );

    const { onCleanup, runCleanup } = makeCleanup();
    mountSapCard(makeCfg(), makeHost(), onCleanup);

    runCleanup();
    deferred?.(ComponentContainer);

    expect(ComponentContainer).not.toHaveBeenCalled();
    expect(placeAt).not.toHaveBeenCalled();
  });

  it('logs an error when window.sap is not available', () => {
    delete (window as unknown as Record<string, unknown>)['sap'];
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const { onCleanup } = makeCleanup();

    mountSapCard(makeCfg(), makeHost(), onCleanup);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[DashboardCard] SAP UI5 is not available on window.sap',
    );
  });
});
