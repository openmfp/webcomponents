import { DashboardCard } from '../card/dashboard-card.component';
import { DashboardI18nService } from '../i18n';
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
      providers: [DashboardI18nService],
    }).compileComponents();
  });

  it('uses w for grid placement and lets content define the height', () => {
    const { fixture } = setup();

    fixture.componentRef.setInput('section', {
      id: 'section-1',
      title: 'Favorites',
      w: 8,
    });
    fixture.componentRef.setInput('cards', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.style.gridColumn).toBe('span 8');
    expect(fixture.nativeElement.style.gridRow).toBe('');
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

    const card = fixture.debugElement.query(By.directive(DashboardCard))
      .componentInstance as DashboardCard;

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

    const card = fixture.debugElement.query(By.directive(DashboardCard))
      .componentInstance as DashboardCard;
    card.removeCard.emit();

    expect(emitted).toEqual(['card-1']);
  });

  describe('data-testid attributes', () => {
    it('sets data-testid on the root section element', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'sec-7',
        title: 'My Section',
      });
      fixture.componentRef.setInput('cards', []);
      fixture.detectChanges();

      const el = root(fixture).querySelector('.section');
      expect(el).not.toBeNull();
      expect(el?.getAttribute('data-testid')).toBe('dashboard-section-sec-7');
    });

    it('sets data-testid on the remove button in editable edit mode', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'sec-7',
        title: 'My Section',
        editable: true,
      });
      fixture.componentRef.setInput('cards', []);
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();

      const btn = root(fixture).querySelector('.section__remove');
      expect(btn).not.toBeNull();
      expect(btn?.getAttribute('data-testid')).toBe(
        'dashboard-section-sec-7-remove',
      );
    });

    it('does not render the remove button data-testid when section is non-editable', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'sec-7',
        title: 'My Section',
        editable: false,
      });
      fixture.componentRef.setInput('cards', []);
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();

      expect(root(fixture).querySelector('.section__remove')).toBeNull();
    });

    it('sets data-testid on the title span when section has a title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'sec-7',
        title: 'My Section',
      });
      fixture.componentRef.setInput('cards', []);
      fixture.detectChanges();

      const titleEl = root(fixture).querySelector('.section__title');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.getAttribute('data-testid')).toBe(
        'dashboard-section-sec-7-title',
      );
    });

    it('does not render the title span when section has no title', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', { id: 'sec-7' });
      fixture.componentRef.setInput('cards', []);
      fixture.detectChanges();

      expect(root(fixture).querySelector('.section__title')).toBeNull();
    });
  });
});
