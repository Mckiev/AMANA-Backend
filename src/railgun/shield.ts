import {
  RailgunERC20AmountRecipient,
  NetworkName,
  TXIDVersion,
  TransactionGasDetails,
  EVMGasType,
} from '@railgun-community/shared-models';
import {
  gasEstimateForShield,
  getShieldPrivateKeySignatureMessage,
  populateShield,
} from '@railgun-community/wallet';
import { InfuraProvider, keccak256, Wallet } from 'ethers';
import config from '../config';

const AMANA_TOKEN_ADDRESS = '0xb7fa2208b49a65f9b9a85956fad7a3f361b248dd';

export const shieldAmana = async (
  to: string,
  amount: bigint,
) => {
  // Formatted token amounts and recipients.
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: AMANA_TOKEN_ADDRESS,
      amount,
      recipientAddress: to,
    },
  ];

  // The shieldPrivateKey enables the sender to decrypt 
  // the receiver's address in the future.

  const wallet = Wallet.fromPhrase(config.mnemonic, new InfuraProvider(137));
  const shieldSignatureMessage = getShieldPrivateKeySignatureMessage();
  const shieldPrivateKey = keccak256(
    await wallet.signMessage(shieldSignatureMessage),
  );

  // Address of public wallet we are shielding from
  const fromWalletAddress = wallet.address;

  const { gasEstimate } = await gasEstimateForShield(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    shieldPrivateKey,
    erc20AmountRecipients,  
    [], // nftAmountRecipients
    fromWalletAddress,
  );

  const maxFeePerGas = 50000000000n; // TODO: Proper estimation of network gasPrice
  const maxPriorityFeePerGas = 2000000000n; // TODO: Proper estimation of network gasPrice
  const gasDetails: TransactionGasDetails = {
    evmGasType: EVMGasType.Type2,
    gasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  const { transaction } = await populateShield(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.Polygon,
    shieldPrivateKey,
    erc20AmountRecipients,  
    [], // nftAmountRecipients
    gasDetails,
  );

  transaction.from = wallet.address;

  console.log('Sending transaction', transaction);

  try {
    // Send transaction
    const tx = await wallet.sendTransaction(transaction);

    // Wait for transaction to be mined
    await tx.wait();

    console.log(`Transaction successful with hash: ${tx.hash}`);
  } catch (error) {
    console.error(`Transaction failed: ${error}`);
}
}
