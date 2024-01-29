import { Mnemonic, randomBytes } from 'ethers';
import { TXIDVersion } from '@railgun-community/engine'
import * as Railgun from './railgun/railgun'
import * as dotenv from 'dotenv';


dotenv.config();

// TODO will need to generate is safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;


async function main() {
    Railgun.initializeEngine();
    await Railgun.loadEngineProvider();
    Railgun.setEngineLoggers();
    
    const railgunWalletInfo = await Railgun.createWallet(encryptionKey, mnemonic, Railgun.creationBlockNumberMap);
    console.log(railgunWalletInfo);
    const wallet = Railgun.walletForID(railgunWalletInfo.id); // Store this value.

    await wallet.getTokenBalances(TXIDVersion.V2_PoseidonMerkle, Railgun.chain, false); // onlySpendable
  
    const tx_info: Railgun.TxInfo = { length: 0 };
    Railgun.setOnBalanceUpdateCallback((balancesFormatted) => Railgun.onBalanceUpdateCallback(balancesFormatted, wallet, Railgun.chain, tx_info));
    //setOnUTXOMerkletreeScanCallback(Railgun.onMerkletreeScanCallback);
    
    await Railgun.refreshBalances(Railgun.chain, undefined);
    console.log('refreshBalances done');
  }  

main().catch(console.error);