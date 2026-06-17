import { DashboardI18nService } from './dashboard-i18n.service';

describe('DashboardI18nService', () => {
  it('returns English translations by default', () => {
    const service = new DashboardI18nService();
    expect(service.language()).toBe('en');
    expect(service.getTranslation('save')).toBe('Save');
    expect(service.getTranslation('unsavedChanges')).toBe('Unsaved Changes');
  });

  it('switches to German when the language signal is set to "de"', () => {
    const service = new DashboardI18nService();
    service.language.set('de');
    expect(service.getTranslation('save')).toBe('Speichern');
    expect(service.getTranslation('unsavedChanges')).toBe(
      'Nicht gespeicherte Änderungen',
    );
    expect(service.getTranslation('discardConfirmBody')).toBe(
      'Änderungen verwerfen? Diese Aktion kann nicht rückgängig gemacht werden.',
    );
  });

  it('switches back to English on subsequent updates', () => {
    const service = new DashboardI18nService();
    service.language.set('de');
    service.language.set('en');
    expect(service.getTranslation('save')).toBe('Save');
  });
});
