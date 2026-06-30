import { GenericResource } from '../../models';
import { FormFieldChangeEvent, FormFieldDefinition } from '../models';
import { DeclarativeForm } from './declarative-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

describe('DeclarativeForm', () => {
  let component: DeclarativeForm<GenericResource>;
  let fixture: ComponentFixture<DeclarativeForm<GenericResource>>;

  const testFields: FormFieldDefinition[] = [
    {
      name: 'metadata.name',
      label: 'Name',
      required: true,
      validation: 'onChange',
    },
    {
      name: 'metadata.namespace',
      label: 'Namespace',
      required: false,
      validation: 'onBlur',
    },
    { name: 'metadata.labels', label: 'Labels' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DeclarativeForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarativeForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', testFields);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should create controls for each field', () => {
      expect(component.form.controls['metadata.name']).toBeDefined();
      expect(component.form.controls['metadata.namespace']).toBeDefined();
      expect(component.form.controls['metadata.labels']).toBeDefined();
    });

    it('should not register validators for required fields', () => {
      const ctrl = component.form.controls['metadata.name'];

      ctrl.setValue('');

      expect(ctrl.validator).toBeNull();
      expect(ctrl.valid).toBe(true);
    });

    it('should pre-populate controls from initialValues without marking dirty', () => {
      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'my-resource',
        'metadata.namespace': 'default',
      });

      fixture.detectChanges();

      expect(component.form.controls['metadata.name'].value).toBe(
        'my-resource',
      );
      expect(component.form.controls['metadata.namespace'].value).toBe(
        'default',
      );
      expect(component.form.controls['metadata.name'].dirty).toBe(false);
      expect(component.getValueState('metadata.name')).toBe('None');
    });

    it('should default missing initialValues keys to empty string', () => {
      fixture.componentRef.setInput('initialValues', {});
      expect(component.form.controls['metadata.name'].value).toBe('');
    });

    it('should render a select when field.values are provided', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'metadata.namespace',
          label: 'Namespace',
          values: ['default', 'kube-system'],
        },
      ]);

      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-metadata.namespace"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-select');
    });

    it('should render an input when field.values are not provided', () => {
      fixture.componentRef.setInput('fields', [
        {
          name: 'metadata.namespace',
          label: 'Namespace',
        },
      ]);

      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const fieldElement = shadowRoot.querySelector(
        '[data-testid="generic-form-field-metadata.namespace"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-input');
    });
  });

  describe('fieldChange output', () => {
    it('should emit on value change for validation: onChange field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.setFormControlValue(
        { target: { value: 'new-value' } } as unknown as Event,
        onChangeField,
      );

      expect(emitted).toEqual([
        { fieldProperty: 'metadata.name', value: 'new-value' },
      ]);
    });

    it('should not emit on blur for validation: onChange field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.onFieldBlur(onChangeField);

      expect(emitted).toEqual([]);
    });

    it('should emit on blur for validation: onBlur field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onBlurField = testFields.find(
        (f) => f.name === 'metadata.namespace',
      )!;
      component.setFormControlValue(
        { target: { value: 'kube-system' } } as unknown as Event,
        onBlurField,
      );

      expect(emitted).toEqual([]);

      component.onFieldBlur(onBlurField);

      expect(emitted).toEqual([
        { fieldProperty: 'metadata.namespace', value: 'kube-system' },
      ]);
    });

    it('should not emit on value change for validation: onBlur field', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const onBlurField = testFields.find(
        (f) => f.name === 'metadata.namespace',
      )!;
      component.setFormControlValue(
        { target: { value: 'kube-system' } } as unknown as Event,
        onBlurField,
      );

      expect(emitted).toEqual([]);
    });

    it('should not emit on change or blur for field without validation', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      const noValidationField = testFields.find(
        (f) => f.name === 'metadata.labels',
      )!;
      component.setFormControlValue(
        { target: { value: 'some-label' } } as unknown as Event,
        noValidationField,
      );
      component.onFieldBlur(noValidationField);

      expect(emitted).toEqual([]);
    });

    it('should emit fieldChange for validated fields when initialValues change', () => {
      const emitted: FormFieldChangeEvent[] = [];
      component.fieldChange.subscribe((event) => emitted.push(event));

      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'my-resource',
        'metadata.namespace': 'ns-value',
      });
      fixture.detectChanges();

      expect(emitted).toEqual(
        expect.arrayContaining([
          { fieldProperty: 'metadata.name', value: 'my-resource' },
          { fieldProperty: 'metadata.namespace', value: 'ns-value' },
        ]),
      );
      expect(
        emitted.find((e) => e.fieldProperty === 'metadata.labels'),
      ).toBeUndefined();
    });
  });

  describe('initial emission', () => {
    it('should emit fieldChange for fields with validation on init', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.detectChanges();

      expect(emitted).toEqual(
        expect.arrayContaining([
          { fieldProperty: 'metadata.name', value: '' },
          { fieldProperty: 'metadata.namespace', value: '' },
        ]),
      );
    });

    it('should not emit fieldChange for fields without validation on init', () => {
      const localFixture = TestBed.createComponent(DeclarativeForm);
      const localComponent = localFixture.componentInstance;

      const emitted: FormFieldChangeEvent[] = [];
      localComponent.fieldChange.subscribe((event) => emitted.push(event));

      localFixture.componentRef.setInput('fields', testFields);
      localFixture.detectChanges();

      expect(
        emitted.find((e) => e.fieldProperty === 'metadata.labels'),
      ).toBeUndefined();
    });
  });

  describe('field errors', () => {
    it('should show no error for a pristine field', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });
      fixture.detectChanges();

      expect(component.getValueState('metadata.name')).toBe('None');
    });

    it('should show error for a dirty field with an error string', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });

      const onChangeField = testFields.find((f) => f.name === 'metadata.name')!;
      component.setFormControlValue(
        { target: { value: '' } } as unknown as Event,
        onChangeField,
      );
      fixture.detectChanges();

      const shadowRoot = fixture.nativeElement.shadowRoot as ShadowRoot;
      const message = shadowRoot.querySelector('[slot="valueStateMessage"]');

      expect(component.getValueState('metadata.name')).toBe('Negative');
      expect(message?.textContent?.trim()).toBe('Name is required');
    });

    it('should show error for a touched field', () => {
      fixture.componentRef.setInput('fieldErrors', {
        'metadata.name': 'Name is required',
      });
      fixture.detectChanges();

      const control = component.form.controls['metadata.name'];
      control.markAsTouched();

      expect(component.getValueState('metadata.name')).toBe('Negative');
    });
  });

  describe('submit output', () => {
    it('should emit nested object built from dotted field names', () => {
      const emitted: Record<string, unknown>[] = [];
      component.formSubmit.subscribe((value) => emitted.push(value));

      component.form.controls['metadata.name'].setValue('my-app');
      component.form.controls['metadata.namespace'].setValue('default');
      component.form.controls['metadata.labels'].setValue('app=my-app');

      component.submit();

      expect(emitted).toEqual([
        {
          metadata: {
            name: 'my-app',
            namespace: 'default',
            labels: 'app=my-app',
          },
        },
      ]);
    });
  });
});
