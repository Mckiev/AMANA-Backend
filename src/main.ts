import * as Railgun from './railgun/railgun';

import manifold, { ManifoldTransactionCallback } from "./manifold";

const handleManifoldTransfer: ManifoldTransactionCallback = (transfer) => {
  console.log('handling a transfer', transfer);
  const zkAddress = Railgun.extractZKaddress(transfer.memo);
  if (zkAddress) {
    console.log('sending amana to', zkAddress);
    const amount = BigInt(transfer.amount) * (10n ** 18n);
    Railgun.sendTransfer(zkAddress, `DEPOSIT FROM ${transfer.from}` , amount);
  }
};

const main = async() => {
  // await Railgun.start();
  manifold.onTransfer(handleManifoldTransfer);
};

main().catch(console.error);