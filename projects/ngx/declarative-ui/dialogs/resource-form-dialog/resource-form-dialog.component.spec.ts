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
});
