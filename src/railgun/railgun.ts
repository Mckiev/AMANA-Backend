import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

export { setEngineLoggers, initializeEngine, creationBlockNumberMap, onBalanceUpdateCallback, onMerkletreeScanCallback, loadEngineProvider} from './engine';
export { TxInfo } from './utils';
export { createRailgunWallet as createWallet, walletForID, setOnBalanceUpdateCallback, refreshBalances} from '@railgun-community/wallet';

export const {chain} = NETWORK_CONFIG[NetworkName.Polygon];
