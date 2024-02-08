import * as Railgun from './railgun/railgun';

import manifold, { ManifoldTransactionCallback } from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';

const handleManifoldTransfer: ManifoldTransactionCallback = async (transfer) => {
  console.log('handling a transfer', transfer);
  const zkAddress = Railgun.extractZKaddress(transfer.memo);
  if (zkAddress) {
    await database.createDepositIfNotExists(zkAddress, transfer.id, transfer.from, transfer.amount);
  }
};

const main = async() => {
  await Railgun.initialize();
  await database.initialize();
  depositProcessor.initialize();
  manifold.onTransfer(handleManifoldTransfer);
};

main().catch(console.error);