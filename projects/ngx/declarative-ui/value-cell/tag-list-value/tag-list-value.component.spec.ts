import { TagSettings } from '../../models';
import { TagListValue } from './tag-list-value.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('TagListValue', () => {
  let fixture: ComponentFixture<TagListValue>;
  let component: TagListValue;

  function setup(tags: string[], tagSettings?: TagSettings) {
    fixture = TestBed.createComponent(TagListValue);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tags', tags);
    if (tagSettings !== undefined) {
      fixture.componentRef.setInput('tagSettings', tagSettings);
    }
    fixture.detectChanges();
    return { fixture, component };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TagListValue],
    }).overrideComponent(TagListValue, {
      set: {
        imports: [],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });
  });

  it('creates', () => {
    const { component } = setup(['a']);
    expect(component).toBeTruthy();
  });

  describe('testId', () => {
    it('defaults to "tag-list-value"', () => {
      const { component } = setup(['x']);
      expect(component.testId()).toBe('tag-list-value');
    });

    it('accepts a custom testId', () => {
      const { fixture } = setup(['x']);
      fixture.componentRef.setInput('testId', 'my-tags');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('[test-id="my-tags"]');
      expect(span).not.toBeNull();
    });
  });

  describe('tag rendering', () => {
    it('renders one ui5-tag per item', () => {
      const { fixture } = setup(['api', 'backend', 'v2']);
      const tags = fixture.nativeElement.querySelectorAll('ui5-tag');
      expect(tags).toHaveLength(3);
    });

    it('renders no tags for empty array', () => {
      const { fixture } = setup([]);
      const tags = fixture.nativeElement.querySelectorAll('ui5-tag');
      expect(tags).toHaveLength(0);
    });

    it('renders tag text content', () => {
      const { fixture } = setup(['prod', 'staging']);
      const tags = fixture.nativeElement.querySelectorAll('ui5-tag');
      const texts = Array.from(tags).map((t) =>
        (t as Element).textContent?.trim(),
      );
      expect(texts).toEqual(['prod', 'staging']);
    });
  });

  describe('tagSettings', () => {
    it('passes design to ui5-tag', () => {
      const { fixture } = setup(['x'], { design: 'Positive' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tag = fixture.nativeElement.querySelector('ui5-tag') as any;
      expect(tag?.design).toBe('Positive');
    });

    it('defaults design to Neutral when tagSettings is absent', () => {
      const { fixture } = setup(['x']);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tag = fixture.nativeElement.querySelector('ui5-tag') as any;
      expect(tag?.design).toBe('Neutral');
    });

    it('passes colorScheme to ui5-tag', () => {
      const { fixture } = setup(['x'], { colorScheme: '5' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tag = fixture.nativeElement.querySelector('ui5-tag') as any;
      expect(tag?.colorScheme).toBe('5');
    });

    it('hides state icon on all tags', () => {
      const { fixture } = setup(['a', 'b']);
      const tags = fixture.nativeElement.querySelectorAll('ui5-tag');
      Array.from(tags).forEach((tag) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((tag as any).hideStateIcon).toBe(true);
      });
    });
  });
});
