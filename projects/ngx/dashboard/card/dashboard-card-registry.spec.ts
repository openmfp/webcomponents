import {
  addDashboardCardComponents,
  resetDashboardCardRegistry,
} from './dashboard-card-registry';
import { Component } from '@angular/core';

@Component({
  selector: 'dashboard-test-card',
  standalone: true,
  template: 'dashboard test card',
})
class DashboardTestCard {}

@Component({
  selector: '[dashboard-test-card]',
  standalone: true,
  template: 'dashboard attr card',
})
class DashboardAttrCard {}

@Component({
  selector: 'dashboard-test-card',
  standalone: true,
  host: {
    'data-test-duplicate': 'true',
  },
  template: 'dashboard duplicate card',
})
class DashboardDuplicateCard {}

@Component({
  selector: 'dashboard-non-standalone-card',
  standalone: false,
  template: 'dashboard non-standalone card',
})
class DashboardNonStandaloneCard {}

describe('dashboard card registry', () => {
  beforeEach(() => {
    resetDashboardCardRegistry();
  });

  it('registers standalone Angular components by selector', () => {
    expect(() => addDashboardCardComponents([DashboardTestCard])).not.toThrow();
  });

  it('rejects non-component registrations', () => {
    class NotAComponent {}

    expect(() => addDashboardCardComponents([NotAComponent])).toThrowError(
      'Dashboard card registration failed: "NotAComponent" is not an Angular component.',
    );
  });

  it('rejects selectors that are not a single element selector', () => {
    expect(() => addDashboardCardComponents([DashboardAttrCard])).toThrowError(
      /must use a single element selector\. Received "\[dashboard-test-card\]"./,
    );
  });

  it('rejects non-standalone Angular components', () => {
    expect(() =>
      addDashboardCardComponents([DashboardNonStandaloneCard]),
    ).toThrowError(
      'Dashboard card registration failed: "dashboard-non-standalone-card" must be a standalone Angular component.',
    );
  });

  it('rejects duplicate selector registrations for different component types', () => {
    addDashboardCardComponents([DashboardTestCard]);

    expect(() =>
      addDashboardCardComponents([DashboardDuplicateCard]),
    ).toThrowError(
      'Dashboard card registration failed: selector "dashboard-test-card" is already registered.',
    );
  });
});
