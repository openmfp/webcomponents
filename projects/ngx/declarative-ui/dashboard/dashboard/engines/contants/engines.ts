import { ZflowGridStackEngine } from '../zflow/z-flow-engine';

export const ENGINES_MAP = {
  zFlow: ZflowGridStackEngine,
  default: undefined,
};

export type EngineClass = (typeof ENGINES_MAP)[keyof typeof ENGINES_MAP];
