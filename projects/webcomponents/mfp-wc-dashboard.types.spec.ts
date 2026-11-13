import type * as Wc from './mfp-wc-dashboard';
import type { OutputEmitterRef } from '@angular/core';
import type {
  AfterCardRequest,
  AfterRequestHook,
  ButtonSettings,
  CardConfig,
  CardSize,
  CardStatus,
  CardStatusState,
  CardsType,
  Dashboard,
  DashboardButtonsSettings,
  DashboardConfig,
  DashboardI18nKey,
  DashboardTranslations,
  DataFetchLastUpdated,
  DataFetchList,
  DataFetchListData,
  DataFetchListLoadError,
  DataFetchLoadError,
  DataFetchTable,
  DataFetchTableData,
  DataFetchTableLoadError,
  ErrorViewConfig,
  JsonValue,
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
    expectTypeOf<
      Extract<
        keyof NonNullable<CardConfig['componentTemplate']>,
        'status' | 'subtitle'
      >
    >().toBeNever();
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
    expectTypeOf<Element['afterCardRequest']>().toEqualTypeOf<
      ReturnType<Dashboard['afterCardRequest']>
    >();
    expectTypeOf<Wc.AfterCardRequest>().toEqualTypeOf<AfterCardRequest>();
  });

  it('shares the public metadata and request types across data-fetch cards', () => {
    expectTypeOf<CardStatus>().toEqualTypeOf<{
      text: string;
      state: CardStatusState;
    }>();
    expectTypeOf<CardStatusState>().toEqualTypeOf<
      'Neutral' | 'Information' | 'Positive' | 'Negative' | 'Critical'
    >();
    expectTypeOf<{
      label: string;
      text: string;
    }>().toExtend<DataFetchLastUpdated>();
    expectTypeOf<{
      label: string;
      path: string;
      locale: string;
    }>().toExtend<DataFetchLastUpdated>();
    expectTypeOf<{
      label: string;
      path: string;
      text: string;
    }>().not.toExtend<DataFetchLastUpdated>();
    expectTypeOf<ReturnType<DataFetchList['data']>>().toEqualTypeOf<
      DataFetchListData | undefined
    >();
    expectTypeOf<ReturnType<DataFetchTable['data']>>().toEqualTypeOf<
      DataFetchTableData | undefined
    >();
    expectTypeOf<ReturnType<DataFetchList['status']>>().toEqualTypeOf<
      CardStatus | undefined
    >();
    expectTypeOf<DataFetchTable['status']>().toEqualTypeOf<
      DataFetchList['status']
    >();
    expectTypeOf<ReturnType<DataFetchList['lastUpdated']>>().toEqualTypeOf<
      DataFetchLastUpdated | undefined
    >();
    expectTypeOf<DataFetchTable['lastUpdated']>().toEqualTypeOf<
      DataFetchList['lastUpdated']
    >();
    expectTypeOf<ReturnType<DataFetchList['afterRequestHook']>>().toEqualTypeOf<
      AfterRequestHook | undefined
    >();
    expectTypeOf<DataFetchTable['afterRequestHook']>().toEqualTypeOf<
      DataFetchList['afterRequestHook']
    >();
    expectTypeOf<AfterRequestHook>().parameters.toEqualTypeOf<
      [response: JsonValue]
    >();
    expectTypeOf<DataFetchListLoadError>().toEqualTypeOf<DataFetchLoadError>();
    expectTypeOf<DataFetchTableLoadError>().toEqualTypeOf<DataFetchLoadError>();
    expectTypeOf<
      OutputPayload<DataFetchList['loadError']>
    >().toEqualTypeOf<DataFetchLoadError>();
    expectTypeOf<DataFetchTable['loadError']>().toEqualTypeOf<
      DataFetchList['loadError']
    >();
  });

  it('types both data-fetch card state inputs without illustration or legacy inputs', () => {
    type State = Omit<ErrorViewConfig, 'illustration'> | undefined;
    type ListEmpty = ReturnType<DataFetchList['emptyState']>;
    type ListError = ReturnType<DataFetchList['errorState']>;
    type TableEmpty = ReturnType<DataFetchTable['emptyState']>;
    type TableError = ReturnType<DataFetchTable['errorState']>;

    expectTypeOf<ListEmpty>().toEqualTypeOf<State>();
    expectTypeOf<ListError>().toEqualTypeOf<State>();
    expectTypeOf<TableEmpty>().toEqualTypeOf<State>();
    expectTypeOf<TableError>().toEqualTypeOf<State>();
    expectTypeOf<
      Extract<
        | keyof NonNullable<ListEmpty>
        | keyof NonNullable<ListError>
        | keyof NonNullable<TableEmpty>
        | keyof NonNullable<TableError>,
        'illustration'
      >
    >().toBeNever();
    expectTypeOf<
      Extract<
        keyof DataFetchList | keyof DataFetchTable,
        'errorTitle' | 'errorMessage' | 'retryButtonText'
      >
    >().toBeNever();
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
