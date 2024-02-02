import {
    TXIDVersion,
    NetworkName,
    TransactionGasDetails,
    RailgunERC20AmountRecipient,
    EVMGasType,
  } from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenTransfer,
  generateTransferProof,
  populateProvedTransfer
} from '@railgun-community/wallet';
import config from '../config';
import * as Railgun from './railgun';
import constants from '../constants';
import { InfuraProvider, Wallet, parseUnits } from 'ethers';

async function sendTransfer() {
  const railgunAddress = '0zk1qyql93qvzye2893gta6y5ha7vq5g25ctnkvnf9mlwjk34pett5utfrv7j6fe3z53lu72huwn80vy3pqt9zrpcuxncuc2tr9p3mv2jtqxkp4hawccfp832zhs6cz';

  // Optional encrypted memo text only readable by the sender and receiver.
  // May include text and emojis. See "Private Transfers" page for details.
  const memoText = 'Private transfer from Alice to Charlie';

  // Formatted token amounts to transfer.
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: constants.TOKENS.AMANA,
      amount: 17n, // hexadecimal amount equivalent to 16
      recipientAddress: railgunAddress,
    },
  ];

  const sendWithPublicWallet = true; // False if sending with Relayer. True if self-signing with public wallet. See "UX: Private Transactions".

  const originalGasEstimate = 0n; // Always 0, we don't have this yet.
  
  const evmGasType = EVMGasType.Type2;
  const maxFeePerGas = parseUnits('100', 'gwei');
  const maxPriorityFeePerGas = parseUnits('50', 'gwei');

  const originalGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate: originalGasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas
  };

  Railgun.initializeEngine();
  await Railgun.loadEngineProvider();
  Railgun.setEngineLoggers();

  const railgunWalletInfo = await Railgun.createWallet(config.encryptionKey, config.mnemonic, Railgun.creationBlockNumberMap);
  console.log(railgunWalletInfo);
  // Need to refresh balances, or wallet may try to spend already spent UTXOs.
  await Railgun.refreshBalances(Railgun.chain, undefined);
 
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
    undefined,
    sendWithPublicWallet,
  );

  const transactionGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas
  };


  const progressCallback = (progress: number) => {
    console.log(`Transfer proof progress: ${progress}`)
    // Handle proof progress (show in UI).
    // Proofs can take 20-30 seconds on slower devices.
  };
  
  const showSenderAddressToRecipient: boolean = false; // Allow recipient to see RAILGUN address of sender

  await generateTransferProof(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    railgunWalletID,
    config.encryptionKey,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // relayerFeeERC20AmountRecipient
    sendWithPublicWallet,
    undefined, // overallBatchMinGasPrice
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
    undefined,//relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    undefined,//overallBatchMinGasPrice,
    transactionGasDetails,
  );



  const transaction_to_send = populateResponse.transaction;

  const wallet_0x = Wallet.fromPhrase(config.mnemonic, new InfuraProvider(137));
  transaction_to_send.from = wallet_0x.address;
  console.log(transaction_to_send);
  try {
    // Send transaction
    const tx = await wallet_0x.sendTransaction(transaction_to_send);
    console.log('Sending transaction', tx);
    // Wait for transaction to be mined
    await tx.wait();

    console.log(`Transaction successful with hash: ${tx.hash}`);
  } catch (error) {
    console.error(`Transaction failed: ${error}`);
  }
  console.log('done');
}

sendTransfer().catch(console.error);