import { EffectCleanupRegisterFn, Renderer2 } from '@angular/core';
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

function makeHost(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
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
    const host = makeHost();
    mountWcCard(makeCfg(), host, onCleanup, makeRenderer());

    expect(host.querySelector('demo-widget')).not.toBeNull();
  });

  it('applies componentInputs as properties on the element', () => {
    const { onCleanup } = makeCleanup();
    const host = makeHost();
    mountWcCard(
      makeCfg({ componentInputs: { title: 'Pods', count: 5 } }),
      host,
      onCleanup,
      makeRenderer(),
    );

    const el = host.querySelector('demo-widget') as HTMLElement & {
      title?: string;
      count?: number;
    };
    expect(el?.title).toBe('Pods');
    expect(el?.count).toBe(5);
  });

  it('renders without errors when componentInputs is omitted', () => {
    const { onCleanup } = makeCleanup();
    expect(() =>
      mountWcCard(makeCfg(), makeHost(), onCleanup, makeRenderer()),
    ).not.toThrow();
  });

  it('clears the host innerHTML on cleanup', () => {
    const { onCleanup, runCleanup } = makeCleanup();
    const host = makeHost();
    mountWcCard(makeCfg(), host, onCleanup, makeRenderer());

    runCleanup();

    expect(host.innerHTML).toBe('');
  });

  it('calls renderer.createElement, setProperty and appendChild in order', () => {
    const { onCleanup } = makeCleanup();
    const host = makeHost();
    const renderer = makeRenderer();
    mountWcCard(
      makeCfg({ componentInputs: { label: 'test' } }),
      host,
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
      host,
      expect.any(HTMLElement),
    );
  });
});
