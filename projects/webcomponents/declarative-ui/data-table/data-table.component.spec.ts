// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and OpenMFP contributors
// SPDX-License-Identifier: Apache-2.0

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture.nativeElement.querySelector('p')?.textContent).toBe(
      'Hello World',
    );
  });
});
