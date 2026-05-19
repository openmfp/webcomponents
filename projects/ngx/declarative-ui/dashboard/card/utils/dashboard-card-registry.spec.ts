import {
  addComponentToRegistry,
  resetDashboardCardRegistry,
} from './dashboard-card-registry';
import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dashboard-test-card',
  standalone: true,
  template: 'dashboard test card',
})
class DashboardTestCard {}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[dashboard-test-card]',
  standalone: true,
  template: 'dashboard attr card',
})
class DashboardAttrCard {}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dashboard-test-card',
  standalone: true,
  template: 'dashboard duplicate card',
  host: {
    'data-test-duplicate': 'true',
  }
})
class DashboardDuplicateCard {}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dashboard-non-standalone-card',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  template: 'dashboard non-standalone card',
})
class DashboardNonStandaloneCard {}

describe('dashboard card registry', () => {
  beforeEach(() => {
    resetDashboardCardRegistry();
  });

  it('registers standalone Angular components by selector', () => {
    expect(() => { addComponentToRegistry([DashboardTestCard]); }).not.toThrow();
  });

  it('rejects non-component registrations', () => {
    class NotAComponent {}

    expect(() => { addComponentToRegistry([NotAComponent]); }).toThrow(
      'Dashboard card registration failed: "NotAComponent" is not an Angular component.',
    );
  });

  it('rejects selectors that are not a single element selector', () => {
    expect(() => { addComponentToRegistry([DashboardAttrCard]); }).toThrow(
      /must use a single element selector\. Received "\[dashboard-test-card\]"./,
    );
  });

  it('rejects non-standalone Angular components', () => {
    expect(() =>
      { addComponentToRegistry([DashboardNonStandaloneCard]); },
    ).toThrow(
      'Dashboard card registration failed: "dashboard-non-standalone-card" must be a standalone Angular component.',
    );
  });

  it('rejects duplicate selector registrations for different component types', () => {
    addComponentToRegistry([DashboardTestCard]);

    expect(() => { addComponentToRegistry([DashboardDuplicateCard]); }).toThrow(
      'Dashboard card registration failed: selector "dashboard-test-card" is already registered.',
    );
  });
});
