import * as Railgun from './railgun/railgun';

import manifold, { ManifoldTransactionCallback } from "./manifold";

function extractZKaddress(memo: string): string | false {
  const pattern = /0zk[a-z0-9]+/;
  const match = memo.match(pattern);
  if (match !== null && match[0].length === 127) {
    return match[0];
  } else {
    return false;
  }
}

const handleManifoldTransfer: ManifoldTransactionCallback = (transfer) => {
  console.log('handling a transfer', transfer);
  const ZKaddress = extractZKaddress(transfer.memo);
  if (ZKaddress) {
    console.log('sending mana to', ZKaddress);
    const amount = BigInt( Number(transfer.amount) * 10**18);
    Railgun.sendTransfer(ZKaddress, `DEPOSIT FROM ${transfer.from}` , amount);
  }

};

const main = async() => {
  // await Railgun.start();
  manifold.onTransfer(handleManifoldTransfer);
};

main().catch(console.error);