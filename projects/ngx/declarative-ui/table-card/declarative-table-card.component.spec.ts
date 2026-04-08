import { DeclarativeTableCardComponent } from './declarative-table-card.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('DeclarativeTableCardComponent', () => {
  let component: DeclarativeTableCardComponent;
  let fixture: ComponentFixture<DeclarativeTableCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarativeTableCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarativeTableCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
