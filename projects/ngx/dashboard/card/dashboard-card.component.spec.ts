import { DashboardCardComponent } from './dashboard-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<DashboardCardComponent>;

function setup(): { fixture: Fixture; component: DashboardCardComponent } {
  const fixture = TestBed.createComponent(DashboardCardComponent);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('DashboardCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent],
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
});
