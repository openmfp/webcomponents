import { FormFieldDefinition } from '../models';
import { DeclarativeForm } from './declarative-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';

describe('DeclarativeForm', () => {
  let component: DeclarativeForm;
  let fixture: ComponentFixture<DeclarativeForm>;

  const testFields: FormFieldDefinition[] = [
    { name: 'metadata.name', label: 'Name', required: true },
    { name: 'metadata.namespace', label: 'Namespace', required: false },
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
    });

    it('should apply required validator when field.required is true', () => {
      const ctrl = component.form.controls['metadata.name'];
      ctrl.setValue('');
      expect(ctrl.valid).toBeFalsy();
    });

    it('should not apply required validator when field.required is false', () => {
      const ctrl = component.form.controls['metadata.namespace'];
      ctrl.setValue('');
      expect(ctrl.valid).toBeTruthy();
    });

    it('should pre-populate controls from initialValues', () => {
      fixture.componentRef.setInput('fields', testFields);
      fixture.componentRef.setInput('initialValues', {
        'metadata.name': 'my-resource',
        'metadata.namespace': 'default',
      });

      fixture.detectChanges();

      expect(component.form.controls['metadata.name'].value).toBe('my-resource');
      expect(component.form.controls['metadata.namespace'].value).toBe('default');
    });

    it('should default missing initialValues keys to empty string', () => {
      fixture.componentRef.setInput('initialValues', {});
      expect(component.form.controls['metadata.name'].value).toBe('');
    });

    it('should apply extra validators from field.validators', () => {
      const emailField: FormFieldDefinition[] = [
        { name: 'email', required: false, validators: [Validators.email] },
      ];
      fixture.componentRef.setInput('fields', emailField);

      fixture.detectChanges();

      component.form.controls['email'].setValue('not-an-email');
      expect(component.form.controls['email'].valid).toBeFalsy();

      component.form.controls['email'].setValue('valid@example.com');
      expect(component.form.controls['email'].valid).toBeTruthy();
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
        '[test-id="generic-form-field-metadata.namespace"]',
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
        '[test-id="generic-form-field-metadata.namespace"]',
      );

      expect(fieldElement?.tagName.toLowerCase()).toBe('ui5-input');
    });
  });

  describe('formValidChange output', () => {
    it('should emit false when a required field is empty', () => {
      const spy = vi.spyOn(component.formValidChange, 'emit');
      component.form.controls['metadata.name'].setValue('');
      component.form.controls['metadata.name'].updateValueAndValidity();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should emit true when all required fields are filled', () => {
      const spy = vi.spyOn(component.formValidChange, 'emit');
      component.form.controls['metadata.name'].setValue('hello');
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should emit false again after clearing a required field', () => {
      component.form.controls['metadata.name'].setValue('hello');
      const spy = vi.spyOn(component.formValidChange, 'emit');
      component.form.controls['metadata.name'].setValue('');
      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('formValue output', () => {
    it('should not emit when form is invalid', () => {
      const spy = vi.spyOn(component.formValue, 'emit');
      component.form.controls['metadata.name'].setValue('');
      component.form.controls['metadata.name'].updateValueAndValidity();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit nested object when form is valid', () => {
      const spy = vi.spyOn(component.formValue, 'emit');
      component.form.controls['metadata.name'].setValue('my-app');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ name: 'my-app' }),
        }),
      );
    });

    it('should use dots in field names as nested path segments', () => {
      fixture.componentRef.setInput('fields', [
        { name: 'spec.replicas', required: true },
      ]);

      fixture.detectChanges();

      const spy = vi.spyOn(component.formValue, 'emit');
      component.form.controls['spec.replicas'].setValue('3');

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ spec: { replicas: '3' } }),
      );
    });
  });

  describe('setFormControlValue', () => {
    it('should set value, mark touched and dirty', () => {
      const event = { target: { value: 'new-value' } };
      const ctrl = component.form.controls['metadata.name'];

      vi.spyOn(ctrl, 'setValue');
      vi.spyOn(ctrl, 'markAsTouched');
      vi.spyOn(ctrl, 'markAsDirty');

      component.setFormControlValue(event as unknown as Event, 'metadata.name');

      expect(ctrl.setValue).toHaveBeenCalledWith('new-value');
      expect(ctrl.markAsTouched).toHaveBeenCalled();
      expect(ctrl.markAsDirty).toHaveBeenCalled();
    });
  });

  describe('getValueState', () => {
    it('should return Negative for invalid and touched control', () => {
      const ctrl = component.form.controls['metadata.name'];
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getValueState('metadata.name')).toBe('Negative');
    });

    it('should return None for valid control', () => {
      const ctrl = component.form.controls['metadata.name'];
      ctrl.setValue('valid');
      ctrl.markAsTouched();
      expect(component.getValueState('metadata.name')).toBe('None');
    });

    it('should return None for untouched invalid control', () => {
      const ctrl = component.form.controls['metadata.name'];
      ctrl.setValue('');
      ctrl.markAsUntouched();
      expect(component.getValueState('metadata.name')).toBe('None');
    });
  });

  describe('onFieldBlur', () => {
    it('should mark control as touched', () => {
      const ctrl = component.form.controls['metadata.name'];
      vi.spyOn(ctrl, 'markAsTouched');

      component.onFieldBlur('metadata.name');

      expect(ctrl.markAsTouched).toHaveBeenCalled();
    });
  });
});
