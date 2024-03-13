import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

import { setEngineLoggers, initializeEngine, creationBlockNumberMap, loadEngineProvider} from './engine';
export { setEngineLoggers, initializeEngine, creationBlockNumberMap, onMerkletreeScanCallback, loadEngineProvider} from './engine';
export { TxHistoryInfo, extractZKaddress, onTransaction} from './utils';
export { createRailgunWallet as createWallet, walletForID, refreshBalances} from '@railgun-community/wallet';
import { createRailgunWallet as createWallet, walletForID, refreshBalances} from '@railgun-community/wallet';

export {sendTransfer} from './self-transfer';
export const {chain} = NETWORK_CONFIG[NetworkName.Polygon];
import config from '../config';
import { TXIDVersion, AbstractWallet } from '@railgun-community/engine';
import { fetchNewTransactions, handleRailgunTransaction } from './utils';

let wallet: AbstractWallet | undefined = undefined;

export const getWallet = (): AbstractWallet => {
    if (wallet === undefined) {
        throw new Error('The Railgun wallet has not yet been initialized');
    }
    return wallet;
}

export const initialize = async () => {
    await initializeEngine();
    await loadEngineProvider();
    setEngineLoggers();
    
    const railgunWalletInfo = await createWallet(config.encryptionKey, config.mnemonic, creationBlockNumberMap);
    console.log(railgunWalletInfo);
    wallet = walletForID(railgunWalletInfo.id); // Store this value.

    await wallet.getTokenBalances(TXIDVersion.V2_PoseidonMerkle, chain, false); // onlySpendable

    await refreshBalances(chain, undefined);
    console.log('Ballances refreshed.');
    console.log('Processing existing Railgun transactions...');
    const allTransactions = await fetchNewTransactions();
    allTransactions.forEach(transaction => {
            handleRailgunTransaction(transaction);
    });
    return wallet;
}