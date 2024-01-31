import {
  Chain,
  ChainType,
  SelectedRelayer,
  RelayerConnectionStatus,
} from '@railgun-community/shared-models';

type RelayerConnectionStatusCallback = (
  chain: Chain,
  status: RelayerConnectionStatus,
) => void;

type RelayerOptions = {
  pubSubTopic?: string;
  additionalDirectPeers?: string[];
  peerDiscoveryTimeout?: number;
};

type RelayerDebugger = {
  log: (msg: string) => void;
  error: (error: Error) => void;
};

export async function getRelayer(): Promise<SelectedRelayer> {

const { WakuRelayerClient } = await import('@railgun-community/waku-relayer-client');


const statusCallback: RelayerConnectionStatusCallback = async(
  chain: Chain,  status: RelayerConnectionStatus,
) => {
  console.log('Relayer status:', status);
  if (status === RelayerConnectionStatus.Connected) {
    connected = true;
  }
};

const relayerDebugger: RelayerDebugger = {
  log: (msg: string) => {
    console.log(msg);
  },
  error: (err: Error) => {
    console.error(err);
  },
};

const initRelayerClient = async (
  statusCallback: RelayerConnectionStatusCallback,
  relayerDebugger: RelayerDebugger
) => {
  
  const chain: Chain = {
    type: ChainType.EVM,
    id: 137, // Polygon
  }
  
  const pubSubTopic = '/waku/2/railgun-relayer'; // The waku topic that Relayers publish to. This value is the default
  const additionalDirectPeers: string[] = []; // Optional direct connection to broadcasting Relayers
  const peerDiscoveryTimeout = 60000; // Timeout to discover Relayers

  const relayerOptions: RelayerOptions = {
    pubSubTopic,
    additionalDirectPeers,
    peerDiscoveryTimeout,
  };
  
  await WakuRelayerClient.start(
    chain,
    relayerOptions,
    statusCallback,
    relayerDebugger,
  );
}

// Call this somewhere on app launch
await initRelayerClient(statusCallback, relayerDebugger);


const chain: Chain = {
  type: ChainType.EVM,
  id: 137 // Chain number, 1 for Ethereum
}

const feeTokenAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // Address of token that the user will pay the Relayer fee in

// Only set to true if you are making a cross-contract call.
// For instance, if you are using a Recipe from the Cookbook. See "Cross-Contract Calls" in the "Transactions" section.
const useRelayAdapt = false;


let connected: boolean = false;
return new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => {
    clearInterval(checkConnectionInterval); // Clear the interval on timeout
    reject(new Error("Connection timeout"));
  }, 60000);

  const checkConnectionInterval = setInterval(async () => {
    if (connected) {
      clearTimeout(timeoutId); // Clear the timeout if connected
      clearInterval(checkConnectionInterval); // Stop checking once we're connected
      try {
        const relayer = await WakuRelayerClient.findBestRelayer(
          chain,
          feeTokenAddress,
          useRelayAdapt,
        );
        resolve(relayer);
      } catch (error) {
        reject(error);
      }
    }
  }, 6000); // Check every second
});
}