import { DashboardCard } from '../card/dashboard-card.component';
import { DashboardI18nService } from '../i18n';
import { DashboardSection } from './dashboard-section.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe } from 'vitest-axe';

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

  describe('cardsHeight', () => {
    function cardHosts(fixture: Fixture): HTMLElement[] {
      return fixture.debugElement
        .queryAll(By.directive(DashboardCard))
        .map((d) => d.nativeElement as HTMLElement);
    }

    it('forces every card in the section to the section height, whatever the card declares', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', h: 10 },
        { id: 'card-2', component: 'demo-widget', h: 55 },
        { id: 'card-3', component: 'demo-widget' },
      ]);
      fixture.detectChanges();

      expect(cardHosts(fixture).map((el) => el.style.gridRow)).toEqual([
        'span 30',
        'span 30',
        'span 30',
      ]);
    });

    it('keeps the override when the card also pins a row start via y', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', h: 10, y: 4 },
      ]);
      fixture.detectChanges();

      expect(cardHosts(fixture)[0]?.style.gridRow).toBe('5 / span 30');
    });

    it('leaves the card width untouched', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', w: 4, h: 10 },
      ]);
      fixture.detectChanges();

      expect(cardHosts(fixture)[0]?.style.gridColumn).toBe('span 4');
    });

    it('falls back to each card own height when the section sets no cardsHeight', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', { id: 'section-1' });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', h: 10 },
        { id: 'card-2', component: 'demo-widget' },
      ]);
      fixture.detectChanges();

      expect(cardHosts(fixture).map((el) => el.style.gridRow)).toEqual([
        'span 10',
        'span 100',
      ]);
    });

    it('re-applies the height when cardsHeight changes', () => {
      const { fixture } = setup();

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', h: 10 },
      ]);
      fixture.detectChanges();

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 12,
      });
      fixture.detectChanges();

      expect(cardHosts(fixture)[0]?.style.gridRow).toBe('span 12');
    });

    it('does not mutate the cards passed in', () => {
      const { fixture } = setup();
      const cards = [{ id: 'card-1', component: 'demo-widget', h: 10 }];

      fixture.componentRef.setInput('section', {
        id: 'section-1',
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', cards);
      fixture.detectChanges();

      expect(cards[0]?.h).toBe(10);
    });

    it('still emits the original card id when an overridden card is removed', () => {
      const { fixture, component } = setup();
      const emitted: string[] = [];

      component.removeCard.subscribe((id) => emitted.push(id));
      fixture.componentRef.setInput('section', {
        id: 'section-1',
        editable: true,
        cardsHeight: 30,
      });
      fixture.componentRef.setInput('cards', [
        { id: 'card-1', component: 'demo-widget', h: 10 },
      ]);
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.directive(DashboardCard))
        .componentInstance as DashboardCard;
      card.removeCard.emit();

      expect(emitted).toEqual(['card-1']);
    });
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

  it('has no automatically-detectable accessibility violations', async () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('section', {
      id: 'section-1',
      title: 'Runtime',
    });
    fixture.componentRef.setInput('cards', []);
    fixture.detectChanges();

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
