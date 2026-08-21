import { DeleteConfirmationDialog } from './delete-confirmation-dialog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('DeleteConfirmationDialog', () => {
  let fixture: ComponentFixture<DeleteConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationDialog);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('config', {
      title: 'Delete resource',
      message: 'This action cannot be undone.',
    });
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
