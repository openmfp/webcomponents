import { MountCfg } from '../../models';

export type CardMountCfg = MountCfg & { autoHeight?: () => boolean };

export type SyncContentHeight = () => void;
