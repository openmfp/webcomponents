import { DASHBOARD_I18N_KEYS } from './dashboard-i18n';
import { DashboardI18nService } from './dashboard-i18n.service';

describe('DashboardI18nService', () => {
  it('returns the built-in English default when no overrides are set', () => {
    const service = new DashboardI18nService();
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.SAVE)).toBe('Save');
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.UNSAVED_CHANGES)).toBe(
      'Unsaved Changes',
    );
  });

  it('uses client-supplied overrides when provided', () => {
    const service = new DashboardI18nService();
    service.overrides.set({
      [DASHBOARD_I18N_KEYS.SAVE]: 'Speichern',
      [DASHBOARD_I18N_KEYS.UNSAVED_CHANGES]: 'Nicht gespeicherte Änderungen',
      [DASHBOARD_I18N_KEYS.DISCARD_CONFIRM_BODY]:
        'Änderungen verwerfen? Diese Aktion kann nicht rückgängig gemacht werden.',
    });
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.SAVE)).toBe('Speichern');
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.UNSAVED_CHANGES)).toBe(
      'Nicht gespeicherte Änderungen',
    );
    expect(
      service.getTranslation(DASHBOARD_I18N_KEYS.DISCARD_CONFIRM_BODY),
    ).toBe(
      'Änderungen verwerfen? Diese Aktion kann nicht rückgängig gemacht werden.',
    );
  });

  it('falls back to the English default for any key not overridden', () => {
    const service = new DashboardI18nService();
    service.overrides.set({ [DASHBOARD_I18N_KEYS.SAVE]: 'Speichern' });
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.SAVE)).toBe('Speichern');
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.CANCEL)).toBe('Cancel');
  });

  it('reflects overrides being swapped (language change)', () => {
    const service = new DashboardI18nService();
    service.overrides.set({ [DASHBOARD_I18N_KEYS.SAVE]: 'Speichern' });
    service.overrides.set({});
    expect(service.getTranslation(DASHBOARD_I18N_KEYS.SAVE)).toBe('Save');
  });
});
