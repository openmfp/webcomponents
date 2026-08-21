import { MockCard } from './mock-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('MockCard', () => {
  let fixture: ComponentFixture<MockCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MockCard);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
