import { Favorites } from './favorites.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('Favorites', () => {
  let fixture: ComponentFixture<Favorites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Favorites],
    }).compileComponents();

    fixture = TestBed.createComponent(Favorites);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
