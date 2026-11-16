import { CardTemplate } from './card-template.component';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

@Component({
  selector: 'mfp-card-template-host',
  imports: [CardTemplate],
  template: `
    <mfp-card-template name="Recent Orders">
      <p class="projected">Order list</p>
    </mfp-card-template>
  `,
})
class CardTemplateHost {}

type Fixture = ComponentFixture<CardTemplate>;

function setup(inputs: Record<string, unknown> = {}): {
  fixture: Fixture;
  component: CardTemplate;
} {
  const fixture = TestBed.createComponent(CardTemplate);
  fixture.componentRef.setInput('name', 'Recent Orders');
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

function query<T extends Element = HTMLElement>(
  fixture: Fixture,
  testId: string,
): T | null {
  return (fixture.nativeElement as HTMLElement).querySelector<T>(
    `[data-testid="${testId}"]`,
  );
}

describe('CardTemplate', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTemplate, CardTemplateHost],
    }).compileComponents();
  });

  it('shows the name as the card title and names the card by it', () => {
    const { fixture } = setup();

    expect(query(fixture, 'card-template-title')?.textContent).toContain(
      'Recent Orders',
    );
    expect(query(fixture, 'card-template')?.getAttribute('aria-label')).toBe(
      'Recent Orders',
    );
  });

  it('projects the card content into the card body', () => {
    const fixture = TestBed.createComponent(CardTemplateHost);
    fixture.detectChanges();

    const body = (fixture.nativeElement as HTMLElement).querySelector(
      '.mfp-card-template__content',
    );
    expect(body?.querySelector('.projected')?.textContent).toBe('Order list');
  });

  it('draws only the frame when header is false', () => {
    const { fixture } = setup({
      header: false,
      badge: { text: 'Action Needed' },
      search: { placeholder: 'Search orders' },
      actions: [{ key: 'export', text: 'Export' }],
      messageStrip: { text: 'Last 30 days' },
    });

    const frame = query(fixture, 'card-template');
    expect(frame?.getAttribute('aria-label')).toBe('Recent Orders');
    expect(frame?.querySelector('header')).toBeNull();
    expect(query(fixture, 'card-template-badge')).toBeNull();
    expect(query(fixture, 'card-template-message-strip')).toBeNull();
  });

  it('switches the frame to transparent', () => {
    const { fixture } = setup({ background: 'transparent' });

    expect(
      query(fixture, 'card-template')?.classList.contains(
        'mfp-card-template--transparent',
      ),
    ).toBe(true);
  });

  it('lets projected content own scrolling when enabled', () => {
    const { fixture } = setup();
    const frame = query(fixture, 'card-template');
    const modifier = 'mfp-card-template--content-scrollable';
    expect(frame?.classList.contains(modifier)).toBe(false);

    fixture.componentRef.setInput('contentScrollable', true);
    fixture.detectChanges();

    expect(frame?.classList.contains(modifier)).toBe(true);
  });

  describe('badge', () => {
    it('is not rendered without a badge', () => {
      const { fixture } = setup();

      expect(query(fixture, 'card-template-badge')).toBeNull();
    });

    it('shows the text with the full text as tooltip and Critical as the default state', () => {
      const { fixture } = setup({ badge: { text: 'Action Needed' } });

      const badge = query<HTMLElement & { design?: string }>(
        fixture,
        'card-template-badge',
      );
      expect(badge?.textContent).toContain('Action Needed');
      expect(badge?.getAttribute('title')).toBe('Action Needed');
      expect(badge?.design).toBe('Critical');
    });

    it('shows the text without a state icon', () => {
      const { fixture } = setup({
        badge: { text: 'Action Needed', state: 'Critical' },
      });

      expect(
        query<HTMLElement & { hideStateIcon?: boolean }>(
          fixture,
          'card-template-badge',
        )?.hideStateIcon,
      ).toBe(true);
    });

    it('uses the given state', () => {
      const { fixture } = setup({
        badge: { text: 'Healthy', state: 'Positive' },
      });

      expect(
        query<HTMLElement & { design?: string }>(fixture, 'card-template-badge')
          ?.design,
      ).toBe('Positive');
    });
  });

  describe('search', () => {
    it('is not rendered without search', () => {
      const { fixture } = setup();

      expect(query(fixture, 'card-template-search')).toBeNull();
    });

    it('uses the placeholder as placeholder and accessible name', () => {
      const { fixture } = setup({ search: { placeholder: 'Search orders' } });

      const input = query<
        HTMLElement & { placeholder?: string; accessibleName?: string }
      >(fixture, 'card-template-search');
      expect(input?.placeholder).toBe('Search orders');
      expect(input?.accessibleName).toBe('Search orders');
    });

    it('updates searchValue while the user types', () => {
      const { fixture, component } = setup({
        search: { placeholder: 'Search orders' },
      });
      const changes: string[] = [];
      component.searchValue.subscribe((value) => changes.push(value));

      const input = query<HTMLElement & { value: string }>(
        fixture,
        'card-template-search',
      );
      if (input) {
        input.value = 'acme';
        input.dispatchEvent(new Event('input'));
      }

      expect(component.searchValue()).toBe('acme');
      expect(changes).toEqual(['acme']);
    });

    it('shows a searchValue set from outside in the field', () => {
      const { fixture } = setup({
        search: { placeholder: 'Search orders' },
        searchValue: 'acme',
      });

      expect(
        query<HTMLElement & { value?: string }>(fixture, 'card-template-search')
          ?.value,
      ).toBe('acme');
    });
  });

  describe('actions', () => {
    const actions = [
      { key: 'export', text: 'Export' },
      { key: 'share', text: 'Share' },
    ];

    it('are not rendered without actions', () => {
      const { fixture } = setup();

      expect(query(fixture, 'card-template-actions')).toBeNull();
    });

    it('open the actions menu from the overflow button named by actionsLabel', () => {
      const { fixture } = setup({ actions, actionsLabel: 'Actions' });

      const button = query<HTMLElement & { accessibleName?: string }>(
        fixture,
        'card-template-actions',
      );
      button?.dispatchEvent(new Event('click'));
      fixture.detectChanges();

      expect(button?.accessibleName).toBe('Actions');
      expect(
        query<HTMLElement & { open?: boolean }>(
          fixture,
          'card-template-actions-menu',
        )?.open,
      ).toBe(true);
      expect(
        query(fixture, 'card-template-action-share')?.getAttribute('data-key'),
      ).toBe('share');
    });

    it('emit the key of the chosen action', () => {
      const { fixture, component } = setup({ actions });
      const pressed: string[] = [];
      component.actionPress.subscribe((key) => pressed.push(key));

      const item = query(fixture, 'card-template-action-share');
      query(fixture, 'card-template-actions-menu')?.dispatchEvent(
        new CustomEvent('item-click', { detail: { item, text: 'Share' } }),
      );

      expect(pressed).toEqual(['share']);
    });
  });

  describe('message strip', () => {
    it('shows the text with Information as the default type', () => {
      const { fixture } = setup({ messageStrip: { text: 'Last 30 days' } });

      const strip = query<HTMLElement & { design?: string }>(
        fixture,
        'card-template-message-strip',
      );
      expect(strip?.textContent).toContain('Last 30 days');
      expect(strip?.design).toBe('Information');
    });

    it('is removed when the user closes it and shown again for a new message', () => {
      const { fixture } = setup({ messageStrip: { text: 'Last 30 days' } });

      query(fixture, 'card-template-message-strip')?.dispatchEvent(
        new CustomEvent('close'),
      );
      fixture.detectChanges();
      expect(query(fixture, 'card-template-message-strip')).toBeNull();

      fixture.componentRef.setInput('messageStrip', {
        text: 'Some orders failed to load',
        type: 'Negative',
      });
      fixture.detectChanges();
      expect(
        query<HTMLElement & { design?: string }>(
          fixture,
          'card-template-message-strip',
        )?.design,
      ).toBe('Negative');
    });
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { fixture } = setup({
      badge: { text: 'Action Needed' },
      search: { placeholder: 'Search orders' },
      actions: [{ key: 'export', text: 'Export' }],
      messageStrip: { text: 'Last 30 days' },
    });

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
