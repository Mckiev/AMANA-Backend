// import * as Railgun from './railgun/railgun';

import manifold, { ManifoldTransactionCallback } from "./manifold";

const handleManifoldTransfer: ManifoldTransactionCallback = (transfer) => {
  console.log('handling a transfer', transfer);
  // Railgun.sendMana(transfer.memo.zkAddress);
};

const main = async() => {
  // await Railgun.start();
  manifold.onTransfer(handleManifoldTransfer);
};

main().catch(console.error);