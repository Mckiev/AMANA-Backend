import {
    TXIDVersion,
    NetworkName,
    TransactionGasDetails,
    RailgunERC20AmountRecipient,
    EVMGasType,
    FeeTokenDetails,
    SelectedRelayer,
    calculateGasPrice,
    calculateMaximumGas,
    ChainType,
    PreTransactionPOIsPerTxidLeafPerList,
    Chain,
  } from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenTransfer,
  generateTransferProof,
  populateProvedTransfer
} from '@railgun-community/wallet';
import { getRelayer } from './relayers';
import config from '../config';
import * as Railgun from './railgun';
import constants from '../constants';
import { Optional } from './engine';

async function sendTransfer() {
  const { RelayerTransaction } = await import('@railgun-community/waku-relayer-client');

  // RAILGUN wallet to transfer to.
  const railgunAddress = '0zk1qyql93qvzye2893gta6y5ha7vq5g25ctnkvnf9mlwjk34pett5utfrv7j6fe3z53lu72huwn80vy3pqt9zrpcuxncuc2tr9p3mv2jtqxkp4hawccfp832zhs6cz';

  // Optional encrypted memo text only readable by the sender and receiver.
  // May include text and emojis. See "Private Transfers" page for details.
  const memoText = 'Private transfer from Alice to Bob';

  // Formatted token amounts to transfer.
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: constants.TOKENS.AMANA,
      amount: 16n, // hexadecimal amount equivalent to 16
      recipientAddress: railgunAddress,
    },
  ];

  const sendWithPublicWallet = false; // False if sending with Relayer. True if self-signing with public wallet. See "UX: Private Transactions".

  const originalGasEstimate = 0n; // Always 0, we don't have this yet.
  
  const evmGasType = EVMGasType.Type1;
  const maxFeePerGas = 100000000000n;
  // const maxPriorityFeePerGas = 2000000000n;

  const originalGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate: originalGasEstimate,
    gasPrice: maxFeePerGas,
    // maxPriorityFeePerGas
  };

  // From their private balance, the user must select a token to pay the relayer fee
  const selectedTokenFeeAddress = config.feeToken;
  const selectedRelayer: SelectedRelayer = await getRelayer(); // See "Relayers" section to select a relayer
  
  // Token Fee for selected Relayer.
  const feeTokenDetails: FeeTokenDetails = {
    tokenAddress: selectedTokenFeeAddress,
    feePerUnitGas: BigInt(selectedRelayer.tokenFee.feePerUnitGas),
  }

  Railgun.initializeEngine();
  await Railgun.loadEngineProvider();
  Railgun.setEngineLoggers();

  const railgunWalletInfo = await Railgun.createWallet(config.encryptionKey, config.mnemonic, Railgun.creationBlockNumberMap);
  console.log(railgunWalletInfo);

  // const wallet = Railgun.walletForID(railgunWalletInfo.id); // Store this value.
  const railgunWalletID = railgunWalletInfo.id;

  const { gasEstimate } = await gasEstimateForUnprovenTransfer(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    railgunWalletID,
    config.encryptionKey,
    memoText,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  );

  const transactionGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate,
    gasPrice: maxFeePerGas,
  };

  const maximumGas = calculateMaximumGas(transactionGasDetails);
  const oneUnitGas = 10n ** 18n;
  const relayerFee = (feeTokenDetails.feePerUnitGas * maximumGas) / oneUnitGas;

  console.log('transactionGasDetails');
  console.log(transactionGasDetails);
  console.log('relayerFee');
  console.log(relayerFee);

  // Token fee to pay Relayer.
  const relayerFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient> = {
    tokenAddress: selectedTokenFeeAddress,
    // NOTE: Proper calculation of "amount" is based on transactionGasDetails and selectedRelayer.
    amount: relayerFee, // See "Relayers" > "Calculating the Relayer Fee" for more info.
    recipientAddress: selectedRelayer.railgunAddress,
  };

  // ONLY required for transactions that are using a Relayer. Can leave undefined if self-signing.
  const overallBatchMinGasPrice: Optional<bigint> = await calculateGasPrice(transactionGasDetails);

  const progressCallback = (progress: number) => {
    console.log(`Transfer proof progress: ${progress}`)
    // Handle proof progress (show in UI).
    // Proofs can take 20-30 seconds on slower devices.
  };
  
  const showSenderAddressToRecipient: boolean = true; // Allow recipient to see RAILGUN address of sender

  await generateTransferProof(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    railgunWalletID,
    config.encryptionKey,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    progressCallback,
  );

  const populateResponse = await populateProvedTransfer(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    railgunWalletID,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  );

  const chain: Chain = {
    type: ChainType.EVM,
    id: constants.CHAINS.POLYGON,
  }

  // Only set to true if you are making a cross-contract call.
  // For instance, if you are using a Recipe from the Cookbook. See "Cross-Contract Calls" in the "Transactions" section.
  const useRelayAdapt = false;

  const nullifiers: string[] = populateResponse.nullifiers ?? [];

  const preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList = {};

  const relayerTransaction = await RelayerTransaction.create(
    TXIDVersion.V2_PoseidonMerkle,
    populateResponse.transaction.to,
    populateResponse.transaction.data,
    selectedRelayer.railgunAddress,
    selectedRelayer.tokenFee.feesID,
    chain,
    nullifiers,
    overallBatchMinGasPrice,
    useRelayAdapt,
    preTransactionPOIsPerTxidLeafPerList,
  );

  const txHash = await relayerTransaction.send();
  console.log('txHash', txHash);
}

sendTransfer().catch(console.error);