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
  // await Railgun.start();
  await database.initialize();
  // await database.createDepositIfNotExists('0zktest', 'transferIdTest', 'userIdTest', 5000n);
  // console.log('inserted with id', id);
  depositProcessor.initialize();
  manifold.onTransfer(handleManifoldTransfer);
  const deposit = await database.getQueuedDeposit();
  console.log('queued deposit', deposit);
};

main().catch(console.error);