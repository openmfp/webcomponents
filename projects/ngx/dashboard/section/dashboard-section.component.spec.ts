import { DashboardCard } from '../card/dashboard-card.component';
import { DashboardSection } from './dashboard-section.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

type Fixture = ComponentFixture<DashboardSection>;

function setup(): { fixture: Fixture; component: DashboardSection } {
  const fixture = TestBed.createComponent(DashboardSection);
  const component = fixture.componentInstance;
  return { fixture, component };
}

function root(fixture: Fixture): ShadowRoot | HTMLElement {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

describe('DashboardSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSection],
    }).compileComponents();
  });

  it('uses w and h for grid placement and renders the title', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('section', {
      id: 'section-1',
      title: 'Favorites',
      w: 8,
      h: 2,
    });
    fixture.componentRef.setInput('cards', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('span 8');
    expect(fixture.nativeElement.style.gridRow).toBe('span 2');
    expect(root(fixture).textContent).toContain('Favorites');
  });

  it('shows a remove button in editable edit mode and emits when clicked', () => {
    const { fixture, component } = setup();
    let emitted = 0;

    component.removeSection.subscribe(() => emitted++);
    fixture.componentRef.setInput('section', {
      id: 'section-1',
      title: 'Favorites',
      editable: true,
    });
    fixture.componentRef.setInput('cards', []);
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const button = root(fixture).querySelector('.section__remove');
    button?.dispatchEvent(new Event('click'));

    expect(button).not.toBeNull();
    expect(emitted).toBe(1);
  });

  it('disables section edit affordances when the section is marked non-editable', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('section', {
      id: 'section-1',
      title: 'Favorites',
      editable: false,
    });
    fixture.componentRef.setInput('cards', [
      { id: 'card-1', component: 'demo-widget' },
    ]);
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const card = fixture.debugElement.query(
      By.directive(DashboardCard),
    ).componentInstance as DashboardCard;

    expect(root(fixture).querySelector('.section__remove')).toBeNull();
    expect(card.editMode()).toBe(false);
  });

  it('emits the card id when a nested card requests removal', () => {
    const { fixture, component } = setup();
    const emitted: string[] = [];

    component.removeCard.subscribe((id) => emitted.push(id));
    fixture.componentRef.setInput('section', {
      id: 'section-1',
      editable: true,
    });
    fixture.componentRef.setInput('cards', [
      { id: 'card-1', component: 'demo-widget' },
    ]);
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const card = fixture.debugElement.query(
      By.directive(DashboardCard),
    ).componentInstance as DashboardCard;
    card.removeCard.emit();

    expect(emitted).toEqual(['card-1']);
  });
});
