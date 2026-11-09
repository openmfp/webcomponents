import type * as Wc from './mfp-wc-dashboard';
import type { OutputEmitterRef } from '@angular/core';
import type {
  ButtonSettings,
  CardConfig,
  CardSize,
  CardsType,
  Dashboard,
  DashboardButtonsSettings,
  DashboardConfig,
  DashboardI18nKey,
  DashboardTranslations,
  ModalSettings,
  MountCfg,
  SectionConfig,
} from '@openmfp/webcomponents/declarative-ui';

type OutputPayload<T> = T extends OutputEmitterRef<infer P> ? P : never;

describe('mfp-wc-dashboard.d.ts', () => {
  it('declares the card and section types of the library', () => {
    expectTypeOf<Wc.CardsType>().toEqualTypeOf<CardsType>();
    expectTypeOf<Wc.CardSize>().toEqualTypeOf<CardSize>();
    expectTypeOf<Wc.CardConfig>().toEqualTypeOf<CardConfig>();
    expectTypeOf<Wc.MountCfg>().toEqualTypeOf<MountCfg>();
    expectTypeOf<Wc.SectionConfig>().toEqualTypeOf<SectionConfig>();
  });

  it('declares the configuration types of the library', () => {
    expectTypeOf<Wc.ModalSettings>().toEqualTypeOf<ModalSettings>();
    expectTypeOf<Wc.ButtonSettings>().toEqualTypeOf<ButtonSettings>();
    expectTypeOf<Wc.DashboardButtonsSettings>().toEqualTypeOf<DashboardButtonsSettings>();
    expectTypeOf<Wc.DashboardConfig>().toEqualTypeOf<DashboardConfig>();
  });

  it('declares the translation types of the library', () => {
    expectTypeOf<Wc.DashboardI18nKey>().toEqualTypeOf<DashboardI18nKey>();
    expectTypeOf<Wc.DashboardTranslations>().toEqualTypeOf<DashboardTranslations>();
  });

  it('types the element properties like the dashboard inputs', () => {
    type Element = Wc.MfpWcDashboardElement;
    expectTypeOf<Element['config']>().toEqualTypeOf<
      ReturnType<Dashboard['config']>
    >();
    expectTypeOf<Element['sections']>().toEqualTypeOf<
      ReturnType<Dashboard['sections']>
    >();
    expectTypeOf<Element['cards']>().toEqualTypeOf<
      ReturnType<Dashboard['cards']>
    >();
    expectTypeOf<Element['availableCards']>().toEqualTypeOf<
      ReturnType<Dashboard['availableCards']>
    >();
    expectTypeOf<Element['customActions']>().toEqualTypeOf<
      ReturnType<Dashboard['customActions']>
    >();
    expectTypeOf<Element['i18n']>().toEqualTypeOf<
      ReturnType<Dashboard['i18n']>
    >();
    expectTypeOf<Element['loading']>().toEqualTypeOf<
      ReturnType<Dashboard['loading']>
    >();
    expectTypeOf<Element['loadingDelay']>().toEqualTypeOf<
      ReturnType<Dashboard['loadingDelay']>
    >();
  });

  it('types the events like the dashboard outputs', () => {
    type Events = Wc.MfpWcDashboardEventMap;
    expectTypeOf<Events['saved']>().toEqualTypeOf<
      CustomEvent<OutputPayload<Dashboard['saved']>>
    >();
    expectTypeOf<Events['actionButtonClick']>().toEqualTypeOf<
      CustomEvent<OutputPayload<Dashboard['actionButtonClick']>>
    >();
    expectTypeOf<Events['unsavedChangesChange']>().toEqualTypeOf<
      CustomEvent<OutputPayload<Dashboard['unsavedChangesChange']>>
    >();
  });

  it('declares the dashboard methods with the signatures of the component', () => {
    type Element = Wc.MfpWcDashboardElement;
    expectTypeOf<Element['requestNavigation']>().toEqualTypeOf<
      Dashboard['requestNavigation']
    >();
    expectTypeOf<Element['saveEdit']>().toEqualTypeOf<Dashboard['saveEdit']>();
    expectTypeOf<Element['cancelEdit']>().toEqualTypeOf<
      Dashboard['cancelEdit']
    >();
    expectTypeOf<Element['confirmDiscard']>().toEqualTypeOf<
      Dashboard['confirmDiscard']
    >();
    expectTypeOf<Element['onUnsavedNavSave']>().toEqualTypeOf<
      Dashboard['onUnsavedNavSave']
    >();
    expectTypeOf<Element['onUnsavedNavDiscard']>().toEqualTypeOf<
      Dashboard['onUnsavedNavDiscard']
    >();
    expectTypeOf<Element['onUnsavedNavCancel']>().toEqualTypeOf<
      Dashboard['onUnsavedNavCancel']
    >();
  });
});
