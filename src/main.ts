import { Mnemonic, randomBytes, formatUnits} from 'ethers';
import { createRailgunWallet, walletForID, setOnUTXOMerkletreeScanCallback,
  setOnBalanceUpdateCallback, refreshBalances, loadProvider, setLoggers, startRailgunEngine, getWalletTransactionHistory} from '@railgun-community/wallet';
import { NetworkName, NETWORK_CONFIG,   MerkletreeScanUpdateEvent,
  RailgunBalancesEvent, FallbackProviderJsonConfig, Chain} from '@railgun-community/shared-models';
import {POIList, TXIDVersion, TransactionHistoryEntry, AbstractWallet} from '@railgun-community/engine';
import "fake-indexeddb/auto";
import LevelDB from 'level-js';
import { createArtifactStore } from './create-artifact-store'; 
import * as dotenv from 'dotenv';
import { log } from 'console';


dotenv.config();

type Optional<T> = T | null | undefined;

const polygonInfuraApi = process.env.POLYGON_INFURA_API;
if (typeof polygonInfuraApi === 'undefined') {
  throw new Error('POLYGON_INFURA_API is not defined in the environment');
}


// TODO will need to generate is safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;

const setEngineLoggers = () => {
  const logMessage: Optional<(msg: any) => void> = console.log;
  const logError: Optional<(err: any) => void> = console.error;
  
  setLoggers(logMessage, logError);
}

const initializeEngine = (): void => {
  // Name for your wallet implementation.
  // Encrypted and viewable in private transaction history.
  // Maximum of 16 characters, lowercase.
  const walletSource = 'quickstart demo';
  
  // LevelDOWN compatible database for storing encrypted wallets.
  const dbPath = '.engine.db';
  const db = new LevelDB(dbPath);
  
  // Whether to forward Engine debug logs to Logger.
  const shouldDebug = true;
  
  // Persistent store for downloading large artifact files required by Engine.
  const artifactStore = createArtifactStore('.Artifacts');
  
  // Whether to download native C++ or web-assembly artifacts.
  // True for mobile. False for nodejs and browser.
  const useNativeArtifacts = false;
  
  // Whether to skip merkletree syncs and private balance scans. 
  // Only set to TRUE in shield-only applications that don't 
  // load private wallets or balances.
  const skipMerkletreeScans = false;
  
  // Array of aggregator node urls for Private Proof of Innocence (Private POI), in order of priority.
  // Only one is required. If multiple urls are provided, requests will fall back to lower priority aggregator nodes if primary request fails.
  // Please reach out in the RAILGUN builders groups for information on the public aggregator nodes run by the community.
  //
  // Private POI is a tool to give cryptographic assurance that funds
  // entering the RAILGUN smart contract are not from a known list
  // of transactions or actors considered undesirable by respective wallet providers.
  // For more information: https://docs.railgun.org/wiki/assurance/private-proofs-of-innocence
  // (additional developer information coming soon).
  const poiNodeURLs:string[] = [];
  
  // Add a custom list to check Proof of Innocence against.
  // Leave blank to use the default list for the aggregator node provided.
  const customPOILists:POIList[] = []
  
  // Set to true if you would like to view verbose logs for private balance and TXID scans
  const verboseScanLogging = false;
  
  startRailgunEngine(
    walletSource,
    db,
    shouldDebug,
    artifactStore,
    useNativeArtifacts,
    skipMerkletreeScans,
    poiNodeURLs,
    customPOILists,
    verboseScanLogging
  )
}
const onMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  console.log('onMerkletreeScanCallback');
  console.log(eventData);
};

const onBalanceUpdateCallback = (balancesFormatted: RailgunBalancesEvent) => {
  console.log('onBalanceUpdateCallback');
  console.log(balancesFormatted);
};


type MapType<T> = {
    [key in NetworkName]?: T;
};
// Block numbers for each chain when wallet was first created.
// If unknown, provide undefined.
const creationBlockNumberMap: MapType<number> = {
    [NetworkName.Ethereum]: 15725700,
    [NetworkName.Polygon]: 3421400,
}

const loadEngineProvider = async () => {
  const POLYGON_PROVIDERS_JSON: FallbackProviderJsonConfig = {
    "chainId": 137,
    "providers": [
      // The following are example providers. Use your preferred providers here.
      {
        "provider": polygonInfuraApi,
        "priority": 1,
        "weight": 1
      },
      {
        "provider": "https://polygon-bor.publicnode.com",
        "priority": 2,
        "weight": 1
      },
    ]
  }

  const shouldDebug = 1;
  
  const { feesSerialized } = await loadProvider(
    POLYGON_PROVIDERS_JSON,
    NetworkName.Polygon,
    shouldDebug,
  );
}

const logTransactionDetails = (transactions: TransactionHistoryEntry[]): void => {
  console.log('Logging transaction details...');
  for (const tx of transactions) {
      try {
          console.log("Token Address:", tx.receiveTokenAmounts[0].tokenData.tokenAddress);
          console.log("Amount:", formatUnits(tx.receiveTokenAmounts[0].amount, 18));
          console.log("MEMO:", tx.receiveTokenAmounts[0].memoText);
      } catch (error) {
        console.log('got ERROR');
          console.error('Error encountered:', error);
      }
  }
}

async function fetchTransactionHistoryRecursive(wallet:AbstractWallet, chain: Chain, tx_length:number) {
  console.log('Fetching transaction history...');
  try {
      const currentTransactionHistory = await wallet.getTransactionHistory(chain, undefined);
      if (currentTransactionHistory.length > tx_length) {
          console.log('New transaction[s] detected!');
          let number_new = currentTransactionHistory.length - tx_length;
          console.log('Number of new transactions:', number_new);
          const newTransactions = Array.from(currentTransactionHistory).slice(0, number_new);
          console.log('new array length: ', newTransactions.length, '\n new txs');
          logTransactionDetails(newTransactions);
          tx_length = currentTransactionHistory.length;

      }
      // Wait for 20 seconds before fetching the history again
      setTimeout(() => fetchTransactionHistoryRecursive(wallet, chain, tx_length), 20000);
  } catch (error) {
      console.error('Error encountered:', error);
      setTimeout(() => fetchTransactionHistoryRecursive(wallet, chain, tx_length), 20000);
  }
}

async function main() {
    initializeEngine();
    await loadEngineProvider();
    setEngineLoggers();
    setOnBalanceUpdateCallback(onBalanceUpdateCallback);
    setOnUTXOMerkletreeScanCallback(onMerkletreeScanCallback);
    const railgunWalletInfo = await createRailgunWallet(encryptionKey, mnemonic, creationBlockNumberMap);
    const railgunWalletID = railgunWalletInfo.id; // Store this value.
    const { chain } = NETWORK_CONFIG[NetworkName.Polygon];
    
    
    
    const refreshAndCheckTransactions = async () => {

      await refreshBalances(chain, undefined);
      console.log('----------BALANCES REFRESHED----------');

      const txidVersion = TXIDVersion.V2_PoseidonMerkle;
      const wallet = walletForID(railgunWalletID);
      await wallet.getTokenBalances(txidVersion, chain, false); // onlySpendable

      let tx_length:number = 0; 
      fetchTransactionHistoryRecursive(wallet, chain, tx_length);

  };
  // Initial check
  await refreshAndCheckTransactions();

  let tx_history = await getWalletTransactionHistory(chain, railgunWalletID, undefined)
  console.log('tx_history: ', tx_history);

  console.log(railgunWalletInfo);

}

main().catch(console.error);