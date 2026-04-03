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

  it('should render without errors when required inputs are provided', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.componentRef.setInput('config', { title: 'Test Dashboard' });
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
