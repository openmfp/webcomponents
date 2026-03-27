import { Dashboard } from './dashboard.component';
import { TestBed } from '@angular/core/testing';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Dashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render hello world', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('p')?.textContent).toBe('Hello World');
  });
});
