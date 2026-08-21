import { ServiceStatusCard } from './service-status-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('ServiceStatusCard', () => {
  let fixture: ComponentFixture<ServiceStatusCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceStatusCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceStatusCard);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
