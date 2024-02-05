import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

import { setEngineLoggers, initializeEngine, creationBlockNumberMap, onBalanceUpdateCallback, loadEngineProvider} from './engine';
export { setEngineLoggers, initializeEngine, creationBlockNumberMap, onBalanceUpdateCallback, onMerkletreeScanCallback, loadEngineProvider} from './engine';
export { TxInfo } from './utils';
import { TxInfo } from './utils';
export { createRailgunWallet as createWallet, walletForID, setOnBalanceUpdateCallback, refreshBalances} from '@railgun-community/wallet';
import { createRailgunWallet as createWallet, walletForID, setOnBalanceUpdateCallback, refreshBalances} from '@railgun-community/wallet';
export const {chain} = NETWORK_CONFIG[NetworkName.Polygon];
import config from '../config'
import { TXIDVersion } from '@railgun-community/engine'

export const start = async () => {
    initializeEngine();
    await loadEngineProvider();
    setEngineLoggers();
    
    const railgunWalletInfo = await createWallet(config.encryptionKey, config.mnemonic, creationBlockNumberMap);
    console.log(railgunWalletInfo);
    const wallet = walletForID(railgunWalletInfo.id); // Store this value.

    await wallet.getTokenBalances(TXIDVersion.V2_PoseidonMerkle, chain, false); // onlySpendable
  
    const tx_info: TxInfo = { length: 0 };
    setOnBalanceUpdateCallback((balancesFormatted) =>onBalanceUpdateCallback(balancesFormatted, wallet, chain, tx_info));
    
    await refreshBalances(chain, undefined);
    console.log('Engine initialized and wallet created');
    return wallet;
}