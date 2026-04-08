import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectOption } from '../models';
import { DeclarativeDynamicSelect } from './declarative-dynamic-select.component';

describe('DeclarativeDynamicSelect', () => {
  let component: DeclarativeDynamicSelect;
  let fixture: ComponentFixture<DeclarativeDynamicSelect>;

  const mockOptions: SelectOption[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  const loadValues = vi.fn().mockResolvedValue(mockOptions);

  beforeEach(async () => {
    loadValues.mockClear();

    await TestBed.configureTestingModule({
      imports: [DeclarativeDynamicSelect],
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarativeDynamicSelect);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('loadValues', loadValues);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadValues on init and populate options', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadValues).toHaveBeenCalledOnce();
    expect(component.options()).toEqual(mockOptions);
  });

  it('should start with empty options before loadValues resolves', () => {
    let resolve!: (v: SelectOption[]) => void;
    loadValues.mockReturnValueOnce(new Promise((r) => (resolve = r)));

    fixture.detectChanges();

    expect(component.options()).toEqual([]);

    resolve(mockOptions);
  });

  it('should emit change event', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.change, 'emit');
    const event = new Event('change');
    component.change.emit(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should emit input event', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.input, 'emit');
    const event = new Event('input');
    component.input.emit(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should emit blur event', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.blur, 'emit');
    component.blur.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should default value to empty string', () => {
    fixture.detectChanges();
    expect(component.value()).toBe('');
  });

  it('should accept value input', () => {
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();
    expect(component.value()).toBe('a');
  });

  it('should default required to false', () => {
    fixture.detectChanges();
    expect(component.required()).toBe(false);
  });

  it('should default valueState to None', () => {
    fixture.detectChanges();
    expect(component.valueState()).toBe('None');
  });
});
