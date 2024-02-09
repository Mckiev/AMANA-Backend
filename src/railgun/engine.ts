import {getProver, loadProvider, setLoggers, startRailgunEngine, SnarkJSGroth16} from '@railgun-community/wallet';
import{ MerkletreeScanUpdateEvent, NetworkName, FallbackProviderJsonConfig} from '@railgun-community/shared-models';
import {POIList} from '@railgun-community/engine';
import { groth16 } from 'snarkjs';
import Level from 'leveldown';
import { createArtifactStore } from './create-artifact-store';

export type Optional<T> = T | null | undefined;

type MapType<T> = {
  [key in NetworkName]?: T;
};

export const setEngineLoggers = () => {
    const logMessage: Optional<(msg: unknown) => void> = console.log;
    const logError: Optional<(err: unknown) => void> = console.error;
    
    setLoggers(logMessage, logError);
  }
  
export  const initializeEngine = (): void => {
    // Name for your wallet implementation.
    // Encrypted and viewable in private transaction history.
    // Maximum of 16 characters, lowercase.
    const walletSource = 'AMANA RAILGUN';
    
    // LevelDOWN compatible database for storing encrypted wallets.
    const dbPath = 'engine.db';
    const db = new Level(dbPath);
    
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
    const snarkGroth16: unknown = groth16;
    getProver().setSnarkJSGroth16(snarkGroth16 as SnarkJSGroth16);
}

export const onMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
    console.log('onMerkletreeScanCallback');
    console.log(eventData);
    };  
  
// Block numbers for each chain when wallet was first created.
// If unknown, provide undefined.
export const creationBlockNumberMap: MapType<number> = {
    [NetworkName.Ethereum]: 15725700,
    [NetworkName.Polygon]: 3421400,
    }

// const polygonInfuraApi = process.env.POLYGON_INFURA_API ?? '';
export const loadEngineProvider = async () => {
    const POLYGON_PROVIDERS_JSON: FallbackProviderJsonConfig = {
      "chainId": 137,
      "providers": [
        // The following are example providers. Use your preferred providers here.
        {
          "provider": "https://1rpc.io/matic",
          "priority": 2,
          "weight": 1
        },
        {
          "provider": "https://polygon-bor.publicnode.com",
          "priority": 1,
          "weight": 1
        },
      ]
    }
  
    const pollingInterval = 5000; // 5 seconds

    await loadProvider(
      POLYGON_PROVIDERS_JSON,
      NetworkName.Polygon,
      pollingInterval,
    );
  }