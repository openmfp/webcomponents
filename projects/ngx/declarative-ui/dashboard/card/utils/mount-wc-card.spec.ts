import { EffectCleanupRegisterFn, Renderer2, ViewContainerRef } from '@angular/core';
import { mountWcCard } from './mount-wc-card';
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

function makeContainer(): { container: ViewContainerRef; el: HTMLElement } {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const container = { element: { nativeElement: el } } as unknown as ViewContainerRef;
  return { container, el };
}

function makeRenderer(): Renderer2 {
  return {
    createElement: vi.fn((tag: string) => document.createElement(tag)),
    setProperty: vi.fn((el: Record<string, unknown>, key: string, value: unknown) => {
      el[key] = value;
    }),
    appendChild: vi.fn((parent: HTMLElement, child: HTMLElement) => {
      parent.appendChild(child);
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
      mountWcCard(makeCfg(), makeContainer().container, onCleanup, makeRenderer());
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
});
