import * as Railgun from './railgun/railgun';
import { RailgunTransaction, isTransactionWithdrawal, extractUsernameWithTrim} from './railgun/utils';

import Manifold, { ManifoldTransactionCallback } from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';
import withdrawalProcessor from './withdrawalProcessor';

const handleManifoldTransfer: ManifoldTransactionCallback = async (transfer) => {
  console.log('handling a transfer', transfer);
  const zkAddress = Railgun.extractZKaddress(transfer.memo);
  if (zkAddress) {
    await database.createDepositIfNotExists(zkAddress, transfer.id, transfer.from, transfer.amount);
  }
};

const handleRailgunTransaction = async (transaction : RailgunTransaction) => {
  console.log('handling RAILGUN transaction', transaction);
  if (isTransactionWithdrawal(transaction)) {
    console.log('handling withdrawal');
    await handleWithdrawal(transaction);
  }
  // TODO handle bets and closes
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
  Manifold.onTransfer(handleManifoldTransfer);
  Railgun.onTransaction(handleRailgunTransaction);
};

main().catch(console.error);