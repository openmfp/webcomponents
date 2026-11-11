import { type BeforeRequest, DataFetchTable } from '../../../data-fetch-table';
import { CardConfig } from '../../models';
import { mountWcCard } from './mount-wc-card';
import {
  EffectCleanupRegisterFn,
  ErrorHandler,
  Injector,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createCustomElement } from '@angular/elements';

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

function makeContainer(injector?: Injector): {
  container: ViewContainerRef;
  el: HTMLElement;
} {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const container = {
    element: { nativeElement: el },
    injector,
  } as unknown as ViewContainerRef;
  return { container, el };
}

function makeRenderer(): Renderer2 {
  return {
    createElement: vi.fn((tag: string) => document.createElement(tag)),
    setProperty: vi.fn(
      (el: Record<string, unknown>, key: string, value: unknown) => {
        el[key] = value;
      },
    ),
    appendChild: vi.fn((parent: HTMLElement, child: HTMLElement) => {
      parent.appendChild(child);
    }),
    removeChild: vi.fn((parent: HTMLElement, child: HTMLElement) => {
      parent.removeChild(child);
    }),
  } as unknown as Renderer2;
}

function makeCfg(overrides: Partial<CardConfig> = {}): CardConfig {
  return { id: 'card-1', component: 'demo-widget', ...overrides };
}

describe('mountWcCard', () => {
  it('appends the web component element to the host', () => {
    const { onCleanup } = makeCleanup();
    const { container, el } = makeContainer();
    mountWcCard(makeCfg(), container, onCleanup, makeRenderer());

    expect(el.querySelector('demo-widget')).not.toBeNull();
  });

  it('applies componentInputs as properties on the element', () => {
    const { onCleanup } = makeCleanup();
    const { container, el } = makeContainer();
    mountWcCard(
      makeCfg({ componentInputs: { title: 'Pods', count: 5 } }),
      container,
      onCleanup,
      makeRenderer(),
    );

    const wc = el.querySelector('demo-widget') as HTMLElement & {
      title?: string;
      count?: number;
    };
    expect(wc?.title).toBe('Pods');
    expect(wc?.count).toBe(5);
  });

  it('renders without errors when componentInputs is omitted', () => {
    const { onCleanup } = makeCleanup();
    expect(() => {
      mountWcCard(
        makeCfg(),
        makeContainer().container,
        onCleanup,
        makeRenderer(),
      );
    }).not.toThrow();
  });

  it('clears the host innerHTML on cleanup', () => {
    const { onCleanup, runCleanup } = makeCleanup();
    const { container, el } = makeContainer();
    mountWcCard(makeCfg(), container, onCleanup, makeRenderer());

    runCleanup();

    expect(el.innerHTML).toBe('');
  });

  it('calls renderer.createElement, setProperty and appendChild in order', () => {
    const { onCleanup } = makeCleanup();
    const { container, el } = makeContainer();
    const renderer = makeRenderer();
    mountWcCard(
      makeCfg({ componentInputs: { label: 'test' } }),
      container,
      onCleanup,
      renderer,
    );

    expect(renderer.createElement).toHaveBeenCalledWith('demo-widget');
    expect(renderer.setProperty).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      'label',
      'test',
    );
    expect(renderer.appendChild).toHaveBeenCalledWith(
      el,
      expect.any(HTMLElement),
    );
  });

  it('reports the mounted element through onMounted', () => {
    const { onCleanup } = makeCleanup();
    const { container, el } = makeContainer();
    const onMounted = vi.fn();
    mountWcCard(makeCfg(), container, onCleanup, makeRenderer(), onMounted);

    expect(onMounted).toHaveBeenCalledWith(el.querySelector('demo-widget'));
  });

  it('applies the hook to the first request of a late-defined Angular element', async () => {
    TestBed.configureTestingModule({ imports: [DataFetchTable] });
    const injector = TestBed.inject(Injector);
    const { container, el } = makeContainer();
    const { onCleanup, runCleanup } = makeCleanup();
    const tag = 'mfp-late-angular-card';
    const onMounted = vi.fn();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(Response.json([]));
    vi.stubGlobal('fetch', fetch);

    try {
      mountWcCard(
        makeCfg({
          component: tag,
          componentInputs: {
            data: { request: { url: 'https://example.test/rows' } },
            columns: [{ property: 'id' }],
          },
        }),
        container,
        onCleanup,
        makeRenderer(),
        onMounted,
        (request) => {
          request.headers.set('Authorization', 'Bearer test');
        },
      );

      expect(el.childElementCount).toBe(0);
      expect(onMounted).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();

      customElements.define(
        tag,
        createCustomElement(DataFetchTable, { injector }),
      );
      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      const request = fetch.mock.calls[0][0];
      expect(request).toBeInstanceOf(Request);
      expect((request as Request).headers.get('Authorization')).toBe(
        'Bearer test',
      );
      expect(onMounted).toHaveBeenCalledExactlyOnceWith(el.firstElementChild);
    } finally {
      runCleanup();
      el.remove();
      vi.unstubAllGlobals();
    }
  });

  it('uses the late native hook setter before applying data', async () => {
    const tag = 'mfp-late-native-card';
    const { container, el } = makeContainer();
    const { onCleanup, runCleanup } = makeCleanup();
    const beforeRequest = vi.fn<BeforeRequest>();
    const cardHook = vi.fn<BeforeRequest>();
    const request = new Request('https://example.test/rows');

    class LateNativeCard extends HTMLElement {
      private requestHook?: BeforeRequest;

      set beforeRequest(hook: BeforeRequest) {
        this.requestHook = hook;
      }

      set data(value: Request) {
        void this.requestHook?.(value);
      }
    }

    mountWcCard(
      makeCfg({
        component: tag,
        componentInputs: { data: request, beforeRequest: cardHook },
      }),
      container,
      onCleanup,
      makeRenderer(),
      undefined,
      beforeRequest,
    );

    customElements.define(tag, LateNativeCard);
    await vi.waitFor(() => {
      expect(beforeRequest).toHaveBeenCalledExactlyOnceWith(request);
    });

    expect(cardHook).not.toHaveBeenCalled();
    expect(el.firstElementChild).toBeInstanceOf(LateNativeCard);
    expect(Object.hasOwn(el.firstElementChild ?? {}, 'beforeRequest')).toBe(
      false,
    );
    runCleanup();
    el.remove();
  });

  it('mounts an unsupported late element without adding a hook property', async () => {
    const tag = 'mfp-late-plain-card';
    const { container, el } = makeContainer();
    const { onCleanup, runCleanup } = makeCleanup();
    const onMounted = vi.fn();

    mountWcCard(
      makeCfg({ component: tag }),
      container,
      onCleanup,
      makeRenderer(),
      onMounted,
      vi.fn(),
    );
    customElements.define(tag, class extends HTMLElement {});
    await vi.waitFor(() => {
      expect(onMounted).toHaveBeenCalledTimes(1);
    });

    const mounted = el.querySelector(tag);
    expect(mounted).not.toBeNull();
    expect(Object.hasOwn(mounted ?? {}, 'beforeRequest')).toBe(false);
    expect(onMounted).toHaveBeenCalledExactlyOnceWith(mounted);
    runCleanup();
    el.remove();
  });

  it('reports a late input setter error once without connecting the element', async () => {
    const tag = 'mfp-late-throwing-card';
    const failure = new Error('Invalid input');
    const handleError = vi.fn();
    const injector = Injector.create({
      providers: [{ provide: ErrorHandler, useValue: { handleError } }],
    });
    const { container, el } = makeContainer(injector);
    const { onCleanup, runCleanup } = makeCleanup();
    const renderer = makeRenderer();
    const onMounted = vi.fn();

    try {
      mountWcCard(
        makeCfg({ component: tag, componentInputs: { data: failure } }),
        container,
        onCleanup,
        renderer,
        onMounted,
        vi.fn(),
      );
      customElements.define(
        tag,
        class extends HTMLElement {
          set data(value: Error) {
            throw value;
          }
        },
      );
      await vi.waitFor(() => {
        expect(handleError).toHaveBeenCalledExactlyOnceWith(failure);
      });

      expect(renderer.setProperty).toHaveBeenCalledTimes(1);
      expect(renderer.appendChild).not.toHaveBeenCalled();
      expect(onMounted).not.toHaveBeenCalled();
    } finally {
      runCleanup();
      el.remove();
      injector.destroy();
    }
  });

  it('ignores a late definition after cleanup and preserves the replacement', async () => {
    const tag = 'mfp-obsolete-card';
    const { container, el } = makeContainer();
    const { onCleanup, runCleanup } = makeCleanup();
    const renderer = makeRenderer();
    const onMounted = vi.fn();
    mountWcCard(
      makeCfg({ component: tag }),
      container,
      onCleanup,
      renderer,
      onMounted,
      vi.fn(),
    );
    runCleanup();

    const replacement = document.createElement('div');
    el.appendChild(replacement);
    customElements.define(tag, class extends HTMLElement {});
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(renderer.setProperty).not.toHaveBeenCalled();
    expect(renderer.appendChild).not.toHaveBeenCalled();
    expect(onMounted).not.toHaveBeenCalled();
    expect(el.childElementCount).toBe(1);
    expect(el.firstElementChild).toBe(replacement);
    el.remove();
  });

  describe('contentHeight', () => {
    it('hands the mounted element the pixel height of its slot', () => {
      const { container, el } = makeContainer();
      Object.defineProperty(el, 'clientHeight', {
        configurable: true,
        value: 280,
      });
      const renderer = makeRenderer();
      const { onCleanup } = makeCleanup();

      mountWcCard(
        { component: 'demo-widget' } as CardConfig,
        container,
        onCleanup,
        renderer,
      );

      const mounted = el.firstElementChild as unknown as {
        contentHeight?: number;
      };
      expect(mounted.contentHeight).toBe(280);
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

      const { container } = makeContainer();
      const { onCleanup, runCleanup } = makeCleanup();

      mountWcCard(
        { component: 'demo-widget' } as CardConfig,
        container,
        onCleanup,
        makeRenderer(),
      );
      runCleanup();

      globalThis.ResizeObserver = original;
      expect(disconnect).toHaveBeenCalled();
    });
  });
});
