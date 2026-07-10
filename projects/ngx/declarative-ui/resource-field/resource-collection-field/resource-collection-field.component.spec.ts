import { FieldDefinition, GenericResource } from '../../models';
import { ResourceCollectionField } from './resource-collection-field.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type Fixture = ComponentFixture<
  ResourceCollectionField<GenericResource, FieldDefinition>
>;
type Comp = ResourceCollectionField<GenericResource, FieldDefinition>;

const CONDITIONS_FIELD: FieldDefinition = {
  label: 'Conditions',
  property: 'status.conditions',
  propertyCollection: [
    { label: 'Type', property: 'status.conditions.type' },
    { label: 'Status', property: 'status.conditions.status' },
    { label: 'Reason', property: 'status.conditions.reason' },
  ],
};

function setup(
  field: FieldDefinition,
  resource?: Partial<GenericResource>,
): { fixture: Fixture; component: Comp } {
  const fixture: Fixture = TestBed.createComponent(
    ResourceCollectionField as unknown as typeof ResourceCollectionField<
      GenericResource,
      FieldDefinition
    >,
  );
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('fieldDefinition', field);
  if (resource !== undefined)
    fixture.componentRef.setInput('resource', resource as GenericResource);
  fixture.detectChanges();
  return { fixture, component };
}

function root(fixture: Fixture): ParentNode {
  return fixture.nativeElement.shadowRoot ?? fixture.nativeElement;
}

function all(fixture: Fixture, selector: string): Element[] {
  return Array.from(root(fixture).querySelectorAll(selector));
}

function el(fixture: Fixture, testId: string): Element | null {
  return root(fixture).querySelector(`[data-testid="${testId}"]`);
}

describe('ResourceCollectionField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCollectionField],
    }).compileComponents();
  });

  it('renders one collapsed card per array entry', () => {
    const { fixture } = setup(CONDITIONS_FIELD, {
      status: {
        conditions: [
          { type: 'Ready', status: 'True', reason: 'OK' },
          { type: 'Progressing', status: 'False', reason: 'Retry' },
        ],
      },
    } as unknown as GenericResource);

    expect(all(fixture, '.card').length).toBe(2);
    expect(all(fixture, '.card__body').length).toBe(0);
  });

  it('shows the first non-empty sub-field as the header preview', () => {
    const { fixture } = setup(CONDITIONS_FIELD, {
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    } as unknown as GenericResource);

    expect(
      el(fixture, 'resource-collection-item-0-toggle')?.textContent,
    ).toContain('Type: Ready');
  });

  it('falls back to label and index when the entry is empty', () => {
    const { fixture } = setup(CONDITIONS_FIELD, {
      status: { conditions: [{}] },
    } as unknown as GenericResource);

    expect(
      el(fixture, 'resource-collection-item-0-toggle')?.textContent,
    ).toContain('Conditions 1');
  });

  it('expands a single card and renders a resource-field per sub-field', () => {
    const { fixture, component } = setup(CONDITIONS_FIELD, {
      status: { conditions: [{ type: 'Ready', status: 'True', reason: 'OK' }] },
    } as unknown as GenericResource);

    component.toggle(0);
    fixture.detectChanges();

    const bodies = all(fixture, '.card__body');
    expect(bodies.length).toBe(1);
    expect(bodies[0].querySelectorAll('mfp-resource-field').length).toBe(3);
    expect(bodies[0].textContent).toContain('Type:');
  });

  it('collapses an expanded card when toggled again', () => {
    const { fixture, component } = setup(CONDITIONS_FIELD, {
      status: { conditions: [{ type: 'Ready' }] },
    } as unknown as GenericResource);

    component.toggle(0);
    fixture.detectChanges();
    expect(all(fixture, '.card__body').length).toBe(1);

    component.toggle(0);
    fixture.detectChanges();
    expect(all(fixture, '.card__body').length).toBe(0);
  });

  it('renders no cards when the collection path is missing or not an array', () => {
    const { fixture } = setup(CONDITIONS_FIELD, {
      status: {},
    } as unknown as GenericResource);

    expect(all(fixture, '.card').length).toBe(0);
  });
});
