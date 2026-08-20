import { WhatsNew } from './whats-new.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('WhatsNew', () => {
  let fixture: ComponentFixture<WhatsNew>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsNew],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsNew);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
