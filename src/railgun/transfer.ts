import {
    TXIDVersion,
    NetworkName,
    TransactionGasDetails,
    RailgunERC20AmountRecipient,
    EVMGasType,
    FeeTokenDetails,
    SelectedRelayer,
  } from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenTransfer
} from '@railgun-community/wallet';
import { Mnemonic, randomBytes } from 'ethers';
import { getRelayer } from './relayers';
import config from '../config';
import * as dotenv from 'dotenv';
dotenv.config();
import * as Railgun from './railgun';

async function sendTransfer() {

  // RAILGUN wallet to transfer to.
  const railgunAddress = '0zk1qyql93qvzye2893gta6y5ha7vq5g25ctnkvnf9mlwjk34pett5utfrv7j6fe3z53lu72huwn80vy3pqt9zrpcuxncuc2tr9p3mv2jtqxkp4hawccfp832zhs6cz';

  // Database encryption key. Keep this very safe.
  const encryptionKey = config.encryptionKey// See "Encryption Keys" in the Private Wallets section.
  const mnemonic = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase; 

  // Optional encrypted memo text only readable by the sender and receiver.
  // May include text and emojis. See "Private Transfers" page for details.
  const memoText = 'Private transfer from Alice to Bob';

  // Formatted token amounts to transfer.
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: '0xb7fa2208b49a65f9b9a85956fad7a3f361b248dd', // AMANA
      amount: BigInt('0x10'), // hexadecimal amount equivalent to 16
      recipientAddress: railgunAddress,
    },
  ];

  const sendWithPublicWallet = false; // False if sending with Relayer. True if self-signing with public wallet. See "UX: Private Transactions".

  const originalGasEstimate = 0n; // Always 0, we don't have this yet.

  
  const evmGasType = EVMGasType.Type2;
  const maxFeePerGas = 50000000000n;
  const maxPriorityFeePerGas = 2000000000n;

  const originalGasDetails: TransactionGasDetails = {
    evmGasType, 
    gasEstimate: originalGasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas
  };

  // From their private balance, the user must select a token to pay the relayer fee
  const selectedTokenFeeAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
  const selectedRelayer: SelectedRelayer = await getRelayer(); // See "Relayers" section to select a relayer
  
  // Token Fee for selected Relayer.
  const feeTokenDetails: FeeTokenDetails = {
    tokenAddress: selectedTokenFeeAddress,
    feePerUnitGas: BigInt(selectedRelayer.tokenFee.feePerUnitGas),
  }


  Railgun.initializeEngine();
  await Railgun.loadEngineProvider();
  Railgun.setEngineLoggers();
  
  console.log('Creating wallet...');
  console.log('encryptionKey:',encryptionKey);
  console.log('mnemonic:', mnemonic);
  const railgunWalletInfo = await Railgun.createWallet(encryptionKey, mnemonic, Railgun.creationBlockNumberMap);
  console.log(railgunWalletInfo);

  // const wallet = Railgun.walletForID(railgunWalletInfo.id); // Store this value.
  const railgunWalletID = railgunWalletInfo.id;

  const { gasEstimate } = await gasEstimateForUnprovenTransfer(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    railgunWalletID,
    encryptionKey,
    memoText,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  );

  // const gasPrice = 0n;



  console.log('gasEstimate:', gasEstimate);
}

sendTransfer().catch(console.error);