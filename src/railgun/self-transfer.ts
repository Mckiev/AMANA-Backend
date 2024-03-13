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
  populateProvedTransfer,
} from '@railgun-community/wallet';
import config from '../config';
import * as Railgun from './railgun';
import constants from '../constants';
import { InfuraProvider, TransactionResponse, Wallet, parseUnits } from 'ethers';

export async function sendTransfer(
  fromWalletId: string,
  recipientAddress: string,
  memoText: string,
  amount: bigint,
): Promise<TransactionResponse> {

  // Formatted token amounts to transfer.
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: constants.TOKENS.AMANA,
      amount: amount, // hexadecimal amount equivalent to 16
      recipientAddress,
    },
  ];

  const sendWithPublicWallet = true; // False if sending with Relayer. True if self-signing with public wallet. See "UX: Private Transactions".

  const originalGasEstimate = 0n; // Always 0, we don't have this yet.
  
  const evmGasType = EVMGasType.Type2;
  const maxFeePerGas = parseUnits('200', 'gwei');
  const maxPriorityFeePerGas = parseUnits('100', 'gwei');

  const originalGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate: originalGasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas
  };

  // Need to refresh balances, or wallet may try to spend already spent UTXOs.
  await Railgun.refreshBalances(Railgun.chain, undefined);

  const { gasEstimate } = await gasEstimateForUnprovenTransfer(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    fromWalletId,
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
    fromWalletId,
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
    fromWalletId,
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
  // Send transaction
  const tx = await wallet_0x.sendTransaction(transaction_to_send);
  console.log('Sending transaction', tx.hash);
  return tx;
}

// Railgun.initialize().then(() => { console.log('Initialized') 

// const railgunAddress = '0zk1qy4sjmg5ecz9575f44yr32adshpz2jf4ylgcs20net0j060zmnsx0rv7j6fe3z53llxnety68h4jjhgjc7qpklk598t4lh7rcp95yp70tlmmpnagl6n2cyedj07'
// const memoText = 'withdraw:mckiev'
// const amount = 15n;

// sendTransfer(railgunAddress, memoText, amount).then((tx) => { console.log(tx.hash) });
// });