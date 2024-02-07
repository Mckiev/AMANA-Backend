import * as Railgun from './railgun/railgun';

import manifold, { ManifoldTransactionCallback } from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';

const handleManifoldTransfer: ManifoldTransactionCallback = async (transfer) => {
  console.log('handling a transfer', transfer);
  const zkAddress = Railgun.extractZKaddress(transfer.memo);
  if (zkAddress) {
    const depositId = await database.createDeposit(zkAddress, transfer.id, transfer.from, transfer.amount);
  }
};

const main = async() => {
  // await Railgun.start();
  await database.initialize();
  // const id = await database.createDeposit('0zktest', 'transferIdTest', 'userIdTest', 5000n);
  // console.log('inserted with id', id);
  // depositProcessor.initialize();
  manifold.onTransfer(handleManifoldTransfer);
  const deposit = await database.getQueuedDeposit();
  console.log('queued deposit', deposit);
};

main().catch(console.error);