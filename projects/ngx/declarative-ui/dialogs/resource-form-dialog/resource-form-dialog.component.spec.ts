import { ResourceFormDialog } from './resource-form-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('ResourceFormDialog', () => {
  let fixture: ComponentFixture<ResourceFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFormDialog);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('config', {
      fields: [{ name: 'metadata.name', label: 'Name' }],
      title: 'Create resource',
    });
    fixture.componentRef.setInput('fields', [
      { name: 'metadata.name', label: 'Name' },
    ]);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });

  it('forwards changes from the inner form', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.fieldChange.subscribe((event) =>
      emitted.push(event),
    );
    const event = {
      fieldProperty: 'metadata.name',
      value: 'updated',
      source: 'user' as const,
    };
    fixture.componentInstance['form']()?.fieldChange.emit(event);
    expect(emitted).toEqual([event]);
  });

  describe('patchForm delegate', () => {
    it('delegates patchForm(values) to the inner form with the same args', async () => {
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', true);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name' },
      ]);
      f.detectChanges();

      // The inner form is the first child DeclarativeForm — spy on its
      // patchForm so we can verify args are forwarded verbatim.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerForm = (f.componentInstance as any).form();
      const spy = vi.spyOn(innerForm, 'patchForm');

      const values = { 'metadata.name': 'from-dialog' };
      f.componentInstance.patchForm(values);

      // Delegate is scheduled via afterNextRender — flush with CD + whenStable.
      f.detectChanges();
      await f.whenStable();

      expect(spy).toHaveBeenCalledWith(values, undefined);
    });

    it('forwards options.emitEvent:false to the inner form', async () => {
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', true);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name', validation: 'onChange' },
      ]);
      f.detectChanges();

      const emitted: unknown[] = [];
      f.componentInstance.fieldChange.subscribe((e) => emitted.push(e));

      f.componentInstance.patchForm(
        { 'metadata.name': 'silent' },
        { emitEvent: false },
      );
      f.detectChanges();
      await f.whenStable();

      expect(emitted).toEqual([]);
    });

    it('emits fieldChange when patchForm is called without options', async () => {
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', true);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name', validation: 'onChange' },
      ]);
      f.detectChanges();

      const emitted: unknown[] = [];
      f.componentInstance.fieldChange.subscribe((e) => emitted.push(e));

      f.componentInstance.patchForm({ 'metadata.name': 'loud' });
      f.detectChanges();
      await f.whenStable();

      // Default is emit — the delegate must NOT suppress.
      expect(emitted).toMatchObject([
        { fieldProperty: 'metadata.name', value: 'loud', source: 'seed' },
      ]);
    });

    it('silently patches when emitEvent: false (no fieldChange emits)', async () => {
      // Silent-seed primitive — hosts call this on edit-open so prefilled
      // values do not echo as `fieldChange` events.
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', true);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name', validation: 'onChange' },
      ]);
      f.detectChanges();

      const emitted: unknown[] = [];
      f.componentInstance.fieldChange.subscribe((e) => emitted.push(e));

      f.componentInstance.patchForm(
        { 'metadata.name': 'from-seed' },
        { emitEvent: false },
      );
      f.detectChanges();
      await f.whenStable();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerForm = (f.componentInstance as any).form();
      expect(innerForm.form.controls['metadata.name']?.value).toBe('from-seed');
      expect(emitted).toEqual([]);
    });
  });

  describe('reset-on-close', () => {
    it('destroys the inner form on close and creates a clean form on reopen', async () => {
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', true);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name' },
      ]);
      f.detectChanges();

      f.componentInstance.patchForm(
        { 'metadata.name': 'user-typed' },
        { emitEvent: false },
      );
      f.detectChanges();
      await f.whenStable();
      const innerForm = f.componentInstance['form']();
      expect(innerForm?.form.controls['metadata.name']?.value).toBe(
        'user-typed',
      );

      f.componentRef.setInput('open', false);
      f.detectChanges();
      await f.whenStable();

      // The old control is gone with its component, so it cannot leak into the next session.
      expect(f.componentInstance['form']()).toBeUndefined();

      f.componentRef.setInput('open', true);
      f.detectChanges();
      await f.whenStable();

      const reopenedForm = f.componentInstance['form']();
      expect(reopenedForm).not.toBe(innerForm);
      expect(reopenedForm?.form.controls['metadata.name']?.value).toBe('');
    });

    it('does not reset on open false → true', async () => {
      const f = TestBed.createComponent(ResourceFormDialog);
      f.componentRef.setInput('open', false);
      f.componentRef.setInput('fields', [
        { name: 'metadata.name', label: 'Name' },
      ]);
      f.detectChanges();

      f.componentRef.setInput('open', true);
      f.detectChanges();

      f.componentInstance.patchForm(
        { 'metadata.name': 'kept' },
        { emitEvent: false },
      );
      f.detectChanges();
      await f.whenStable();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerForm = (f.componentInstance as any).form();
      expect(innerForm.form.controls['metadata.name']?.value).toBe('kept');
    });
  });
});
