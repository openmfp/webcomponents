import { FieldFilterDefinition } from '../models/configs';
import { FilterTabs } from './filter-tabs.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'vitest-axe';

describe('FilterTabs', () => {
  let fixture: ComponentFixture<FilterTabs>;

  const TABS: FieldFilterDefinition[] = [
    { label: 'Running', property: 'status.phase', value: 'Running' },
    { label: 'Pending', property: 'status.phase', value: 'Pending' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterTabs],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterTabs);
    fixture.componentRef.setInput('tabs', TABS);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
