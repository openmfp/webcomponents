import { DashboardCard } from './dashboard-card.component';
import { DashboardI18nService } from '../i18n';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<DashboardCard>;

function setup(): { fixture: Fixture; component: DashboardCard } {
  const fixture = TestBed.createComponent(DashboardCard);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('DashboardCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCard],
      providers: [DashboardI18nService],
    }).compileComponents();
  });

  it('uses w and h for grid placement on the host element', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
      h: 2,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('span 3');
    expect(fixture.nativeElement.style.gridRow).toBe('span 2');
  });

  it('uses x and y as zero-based grid start coordinates when provided', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      w: 3,
      h: 2,
      x: 0,
      y: 4,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('1 / span 3');
    expect(fixture.nativeElement.style.gridRow).toBe('5 / span 2');
  });

  it('renders a dynamic component and applies component inputs', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      componentInputs: { title: 'Pods', count: 3 },
    });
    fixture.detectChanges();

    const element = root(fixture).querySelector('demo-widget') as
      | (HTMLElement & { title?: string; count?: number })
      | null;

    expect(element).not.toBeNull();
    expect(element?.title).toBe('Pods');
    expect(element?.count).toBe(3);
  });

  it('replaces the rendered dynamic component when the card definition changes', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
      componentInputs: { title: 'Pods' },
    });
    fixture.detectChanges();
    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'next-widget',
      componentInputs: { title: 'Services' },
    });
    fixture.detectChanges();

    const current = root(fixture).querySelector('next-widget') as
      | (HTMLElement & { title?: string })
      | null;

    expect(root(fixture).querySelector('demo-widget')).toBeNull();
    expect(current?.title).toBe('Services');
  });

  it('shows a remove action in edit mode and emits when it is clicked', () => {
    const { fixture, component } = setup();
    let emitted = 0;

    component.removeCard.subscribe(() => emitted++);
    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: 'demo-widget',
    });
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const button = root(fixture).querySelector('.card__remove');
    button?.dispatchEvent(new Event('click'));

    expect(button).not.toBeNull();
    expect(emitted).toBe(1);
  });

  it('renders the fallback card shell when no dynamic component tag is provided', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('card', {
      id: 'card-1',
      component: '',
    });
    fixture.detectChanges();

    expect(root(fixture).querySelector('.card__body')).not.toBeNull();
    expect(root(fixture).querySelector('.component-card')).toBeNull();
  });

  describe('sap-ui type', () => {
    let placeAt: ReturnType<typeof vi.fn>;
    let destroy: ReturnType<typeof vi.fn>;
    let sapRequire: ReturnType<typeof vi.fn>;
    let ComponentContainer: ReturnType<typeof vi.fn>;

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
    });

    it('calls sap.ui.require with ComponentContainer dependency', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(sapRequire).toHaveBeenCalledWith(
        ['sap/ui/core/ComponentContainer'],
        expect.any(Function),
      );
    });

    it('mounts the SAP component with correct config', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
        componentInputs: { env: 'prod' },
      });
      fixture.detectChanges();

      expect(placeAt).toHaveBeenCalledTimes(1);
      expect(placeAt.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });

    it('destroys the SAP container when the card definition changes', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.Other',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('does not mount a SAP container after the card is cleaned up', () => {
      const requireResolver: { current?: (ctor: unknown) => void } = {};
      sapRequire.mockImplementationOnce(
        (_deps: unknown, cb: (ctor: unknown) => void) => {
          requireResolver.current = cb;
        },
      );
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'demo-widget',
      });
      fixture.detectChanges();

      requireResolver.current?.(ComponentContainer);

      expect(ComponentContainer).not.toHaveBeenCalled();
      expect(placeAt).not.toHaveBeenCalled();
    });

    it('logs an error when window.sap is not available', () => {
      delete (window as unknown as Record<string, unknown>)['sap'];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
      const { fixture } = setup();

      fixture.componentRef.setInput('card', {
        id: 'card-1',
        component: 'my.sap.App',
        type: 'sap-ui',
      });
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DashboardCard] SAP UI5 is not available on window.sap',
      );
      consoleSpy.mockRestore();
    });
  });
});
