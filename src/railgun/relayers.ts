import {
  Chain,
  ChainType,
  SelectedRelayer,
  RelayerConnectionStatus,
} from '@railgun-community/shared-models';
import constants from '../constants';
import config from '../config';

const wait = (delay: number) => new Promise(resolve => {
  setTimeout(resolve, delay);
});

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
    
const chain: Chain = {
  type: ChainType.EVM,
  id: constants.CHAINS.POLYGON,
};

export async function getRelayer(): Promise<SelectedRelayer> {
  const { WakuRelayerClient } = await import('@railgun-community/waku-relayer-client');

  let connected: boolean = false;

  const statusCallback: RelayerConnectionStatusCallback = async(
    chain: Chain,
    status: RelayerConnectionStatus,
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

  const feeTokenAddress = config.feeToken; // Address of token that the user will pay the Relayer fee in

  // Only set to true if you are making a cross-contract call.
  // For instance, if you are using a Recipe from the Cookbook. See "Cross-Contract Calls" in the "Transactions" section.
  const useRelayAdapt = false;

  for (let i = 0; i < 10; i += 1) {
    if (connected) {
      const relayer = await WakuRelayerClient.findBestRelayer(
        chain,
        feeTokenAddress,
        useRelayAdapt,
      );
      return relayer;
    }
    await wait(6000);
  }

  throw new Error("Connection timeout");
}