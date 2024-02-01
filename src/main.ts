import { TXIDVersion } from '@railgun-community/engine'
import * as Railgun from './railgun/railgun'
import config from './config';
import server from './server';

// async function main() {
//   Railgun.initializeEngine();
//   await Railgun.loadEngineProvider();
//   Railgun.setEngineLoggers();
  
//   const railgunWalletInfo = await Railgun.createWallet(config.encryptionKey, config.mnemonic, Railgun.creationBlockNumberMap);
//   console.log(railgunWalletInfo);
//   const wallet = Railgun.walletForID(railgunWalletInfo.id); // Store this value.

//   await wallet.getTokenBalances(TXIDVersion.V2_PoseidonMerkle, Railgun.chain, false); // onlySpendable

//   const tx_info: Railgun.TxInfo = { length: 0 };
//   Railgun.setOnBalanceUpdateCallback((balancesFormatted) => Railgun.onBalanceUpdateCallback(balancesFormatted, wallet, Railgun.chain, tx_info));
//   //setOnUTXOMerkletreeScanCallback(Railgun.onMerkletreeScanCallback);
  
//   await Railgun.refreshBalances(Railgun.chain, undefined);
//   console.log('refreshBalances done');
// }

const main = async () => {
  console.log('Starting server');
  await server.initialize();
  console.log('Started server');
}

main().catch(console.error);