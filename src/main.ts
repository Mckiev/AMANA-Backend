import * as Railgun from './railgun/railgun';
import { RailgunTransaction, isTransactionWithdrawal, isTransactionBet, extractUsernameWithTrim, extractBet} from './railgun/utils';

import Manifold, { ManifoldTransactionCallback } from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';
import withdrawalProcessor from './withdrawalProcessor';
import betProcessor from './betProcessor';
// import config from './config';
// import wait from './utils/wait';

const handleManifoldTransfer: ManifoldTransactionCallback = async (transfer) => {
  // console.log('handling a transfer', transfer);
  const zkAddress = Railgun.extractZKaddress(transfer.memo);
  if (zkAddress) {
    await database.createDepositIfNotExists(zkAddress, transfer.id, transfer.from, transfer.amount);
  }
};

const handleRailgunTransaction = async (transaction : RailgunTransaction) => {
  console.log('handling RAILGUN transaction', transaction);
  try {
    if (isTransactionWithdrawal(transaction)) {
      // console.log('handling withdrawal');
      await handleWithdrawal(transaction);
    }
    if (isTransactionBet(transaction)) {
      // console.log('handling bet');
      await handleBet(transaction);
    }
  } catch (e) {
    console.error('Failed to handle transaction', transaction.txid);
    await database.addFailedTransaction(transaction.txid);
  }

  // TODO handle bets and closes
}

const handleBet = async (transaction : RailgunTransaction) => {
  const [marketURL, prediction, redemptionAddress] = extractBet(transaction.memo);
  const manifoldMarketId = await Manifold.getMarketID(marketURL);
  await database.createBet(transaction.txid, transaction.timestamp, transaction.amount,  marketURL, manifoldMarketId, prediction, redemptionAddress);
}
  

const handleWithdrawal = async (transaction : RailgunTransaction) => {
  const manifoldUsername = extractUsernameWithTrim(transaction.memo);
  const manifoldUsedId = await Manifold.getUserID(manifoldUsername);
  //TODO: handle if username not found
  await database.createWithdrawal(transaction.txid, transaction.timestamp, manifoldUsedId, manifoldUsername, transaction.amount);
}

const main = async() => {
  await Railgun.initialize();
  await database.initialize();
  depositProcessor.initialize();
  withdrawalProcessor.initialize();
  betProcessor.initialize();
  Manifold.onTransfer(handleManifoldTransfer);
  Railgun.onTransaction(handleRailgunTransaction);

  // await wait(15_000);
  // console.log('Sending test transfer...');
  // const railgunWalletInfo = await Railgun.createWallet(config.encryptionKey, config.userMnemonic, Railgun.creationBlockNumberMap);
  // console.log('Sending from address', railgunWalletInfo.railgunAddress);
  // const tx = await Railgun.sendTransfer(railgunWalletInfo.id, Railgun.getWallet().getAddress(), 'bet:MP/will-a-large-language-models-beat-a:NO:0zk1qyrydfzxe9sjeqmduhcwhdg4vqzsskx9x8ww7drhpfnt6m6m80e24rv7j6fe3z53l70m3u6jw99re6yqjvjzkgrsu2enr0xn30dwuwu402tg54cwny9yq0sh4xn', 10n);
  // console.log('Sent test transfer.');
  // console.log(tx);
};

main().catch(console.error);

export default main;