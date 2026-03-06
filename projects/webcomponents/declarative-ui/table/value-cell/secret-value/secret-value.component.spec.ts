import { SecretValue } from './secret-value.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('SecretValueComponent', () => {
  let component: SecretValue;
  let fixture: ComponentFixture<SecretValue>;

  const makeComponent = (value: string) => {
    fixture = TestBed.createComponent(SecretValue);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('value', value);

    fixture.detectChanges();

    return { component, fixture };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SecretValue],
      schemas: [],
    });
  });

  it('should create', () => {
    const { component } = makeComponent('test-secret');
    expect(component).toBeTruthy();
  });

  it('should initialize with isVisible as false', () => {
    const { component } = makeComponent('test-secret');
    expect(component.isVisible()).toBe(false);
  });

  it('should mask value with asterisks', () => {
    const { component, fixture } = makeComponent('my-secret-password');
    const compiled = fixture.nativeElement;

    expect(component.maskedValue()).toBe(
      '*'.repeat('my-secret-password'.length),
    );
    expect(compiled.querySelector('.secret-value')?.textContent?.trim()).toBe(
      '*'.repeat('my-secret-password'.length),
    );
  });

  it('should mask empty string with default 8 asterisks', () => {
    const { component, fixture } = makeComponent('');
    const compiled = fixture.nativeElement;

    expect(component.maskedValue()).toBe('*'.repeat(8));
    expect(compiled.querySelector('.secret-value')?.textContent?.trim()).toBe(
      '*'.repeat(8),
    );
  });

  it('should mask short value correctly', () => {
    const { component, fixture } = makeComponent('abc');
    const compiled = fixture.nativeElement;

    expect(component.maskedValue()).toBe('***');
    expect(compiled.querySelector('.secret-value')?.textContent?.trim()).toBe(
      '***',
    );
  });

  it('should mask long value correctly', () => {
    const longValue = 'a'.repeat(100);
    const { component, fixture } = makeComponent(longValue);
    const compiled = fixture.nativeElement;

    expect(component.maskedValue()).toBe('*'.repeat(100));
    expect(compiled.querySelector('.secret-value')?.textContent?.trim()).toBe(
      '*'.repeat(100),
    );
  });

  it('should display masked value by default', () => {
    const { fixture } = makeComponent('secret-value');
    const compiled = fixture.nativeElement;

    const secretSpan = compiled.querySelector('.secret-value');

    expect(secretSpan).toBeTruthy();
    expect(secretSpan?.classList.contains('masked')).toBe(true);
    expect(secretSpan?.textContent?.trim()).toBe(
      '*'.repeat('secret-value'.length),
    );
  });

  it('should display original value when isVisible is true', () => {
    const { fixture } = makeComponent('secret-value');

    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const secretSpan = compiled.querySelector('.secret-value');

    expect(secretSpan).toBeTruthy();
    expect(secretSpan?.classList.contains('masked')).toBe(false);
    expect(secretSpan?.textContent?.trim()).toBe('secret-value');
  });

  it('should switch from masked to original when isVisible changes', () => {
    const { component, fixture } = makeComponent('secret-value');
    const compiled = fixture.nativeElement;
    const secretSpan = compiled.querySelector('.secret-value');

    expect(component.isVisible()).toBe(false);
    expect(secretSpan?.classList.contains('masked')).toBe(true);
    expect(secretSpan?.textContent?.trim()).toBe(
      '*'.repeat('secret-value'.length),
    );

    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();

    expect(component.isVisible()).toBe(true);
    expect(secretSpan?.classList.contains('masked')).toBe(false);
    expect(secretSpan?.textContent?.trim()).toBe('secret-value');
  });

  it('should switch back to masked when isVisible changes to false', () => {
    const { component, fixture } = makeComponent('secret-value');

    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    expect(component.isVisible()).toBe(true);

    fixture.componentRef.setInput('isVisible', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const secretSpan = compiled.querySelector('.secret-value');

    expect(component.isVisible()).toBe(false);
    expect(secretSpan?.classList.contains('masked')).toBe(true);
    expect(secretSpan?.textContent?.trim()).toBe(
      '*'.repeat('secret-value'.length),
    );
  });

  it('should update masked value when input changes', () => {
    const { component, fixture } = makeComponent('initial');
    expect(component.maskedValue()).toBe('*'.repeat('initial'.length));

    fixture.componentRef.setInput('value', 'updated-secret');
    fixture.detectChanges();

    expect(component.maskedValue()).toBe('*'.repeat('updated-secret'.length));
  });

  it('should maintain visibility state when input changes', () => {
    const { component, fixture } = makeComponent('initial');

    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();

    expect(component.isVisible()).toBe(true);

    fixture.componentRef.setInput('value', 'updated-secret');
    fixture.detectChanges();

    expect(component.isVisible()).toBe(true);
    const compiled = fixture.nativeElement;
    const secretSpan = compiled.querySelector('.secret-value');
    expect(secretSpan?.textContent?.trim()).toBe('updated-secret');
  });

  it('should have default testId', () => {
    const { component } = makeComponent('test-secret');
    expect(component.testId()).toBe('secret-value');
  });

  it('should accept custom testId', () => {
    fixture = TestBed.createComponent(SecretValue);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('value', 'test-secret');
    fixture.componentRef.setInput('testId', 'custom-secret-test-id');

    fixture.detectChanges();

    expect(component.testId()).toBe('custom-secret-test-id');
  });
});
