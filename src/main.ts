import { Mnemonic, randomBytes } from 'ethers';
import { createRailgunWallet, loadWalletByID } from '@railgun-community/wallet';
import { NetworkName } from '@railgun-community/shared-models';
import {POIList} from '@railgun-community/engine';
import "fake-indexeddb/auto";
import * as dotenv from 'dotenv';
dotenv.config();

// TODO will need to generate is safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;

import { 
  startRailgunEngine, 
} from '@railgun-community/wallet';
import LevelDB from 'level-js';
import { createArtifactStore } from './create-artifact-store'; // We'll get to this in Step 2: Build a persistent store
​
const initializeEngine = (): void => {
  // Name for your wallet implementation.
  // Encrypted and viewable in private transaction history.
  // Maximum of 16 characters, lowercase.
  const walletSource = 'quickstart demo';
  
  // LevelDOWN compatible database for storing encrypted wallets.
  const dbPath = 'engine.db';
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

initializeEngine();

type MapType<T> = {
    [key in NetworkName]?: T;
};
// Block numbers for each chain when wallet was first created.
// If unknown, provide undefined.
const creationBlockNumberMap: MapType<number> = {
    [NetworkName.Ethereum]: 15725700,
    [NetworkName.Polygon]: 3421400,
}

async function main() {
    const railgunWalletInfo = await createRailgunWallet(encryptionKey, mnemonic, creationBlockNumberMap);
    const id = railgunWalletInfo.id; // Store this value.

    console.log(railgunWalletInfo);
    console.log(id);
}

main().catch(console.error);