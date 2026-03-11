import {
  ICON_DESIGN_NEGATIVE,
  ICON_DESIGN_POSITIVE,
  ICON_NAME_NEGATIVE,
  ICON_NAME_POSITIVE,
} from './boolean-cell.constants';
import { BooleanValue } from './boolean-value.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('BooleanValueComponent', () => {
  let component: BooleanValue;
  let fixture: ComponentFixture<BooleanValue>;

  const makeComponent = (boolValue: boolean) => {
    fixture = TestBed.createComponent(BooleanValue);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('boolValue', boolValue);

    fixture.detectChanges();

    return { component, fixture };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BooleanValue],
    }).overrideComponent(BooleanValue, {
      set: {
        imports: [],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      },
    });
  });

  it('should create', () => {
    const { component } = makeComponent(true);
    expect(component).toBeTruthy();
  });

  it('should set positive icon design and name for true value', () => {
    const { component } = makeComponent(true);

    expect(component.iconDesign()).toBe(ICON_DESIGN_POSITIVE);
    expect(component.iconName()).toBe(ICON_NAME_POSITIVE);
  });

  it('should set negative icon design and name for false value', () => {
    const { component } = makeComponent(false);

    expect(component.iconDesign()).toBe(ICON_DESIGN_NEGATIVE);
    expect(component.iconName()).toBe(ICON_NAME_NEGATIVE);
  });

  it('should render ui5-icon for true value', () => {
    const { fixture } = makeComponent(true);
    const compiled = fixture.nativeElement;
    const iconElement = compiled.querySelector('ui5-icon');

    expect(iconElement).toBeTruthy();
  });

  it('should render ui5-icon for false value', () => {
    const { fixture } = makeComponent(false);
    const compiled = fixture.nativeElement;
    const iconElement = compiled.querySelector('ui5-icon');

    expect(iconElement).toBeTruthy();
  });

  it('should update icon when boolValue changes from true to false', () => {
    const { component, fixture } = makeComponent(true);

    expect(component.iconDesign()).toBe(ICON_DESIGN_POSITIVE);
    expect(component.iconName()).toBe(ICON_NAME_POSITIVE);

    fixture.componentRef.setInput('boolValue', false);
    fixture.detectChanges();

    expect(component.iconDesign()).toBe(ICON_DESIGN_NEGATIVE);
    expect(component.iconName()).toBe(ICON_NAME_NEGATIVE);
  });

  it('should update icon when boolValue changes from false to true', () => {
    const { component, fixture } = makeComponent(false);

    expect(component.iconDesign()).toBe(ICON_DESIGN_NEGATIVE);
    expect(component.iconName()).toBe(ICON_NAME_NEGATIVE);

    fixture.componentRef.setInput('boolValue', true);
    fixture.detectChanges();

    expect(component.iconDesign()).toBe(ICON_DESIGN_POSITIVE);
    expect(component.iconName()).toBe(ICON_NAME_POSITIVE);
  });

  it('should have required boolValue input', () => {
    const { component } = makeComponent(true);
    expect(component.boolValue()).toBe(true);
  });

  it('should have default testId', () => {
    const { component } = makeComponent(true);
    expect(component.testId()).toBe('boolean-value-icon');
  });

  it('should accept custom testId', () => {
    fixture = TestBed.createComponent(BooleanValue);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('boolValue', true);
    fixture.componentRef.setInput('testId', 'custom-test-id');

    fixture.detectChanges();

    expect(component.testId()).toBe('custom-test-id');
  });
});
