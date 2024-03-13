import * as Railgun from './railgun/railgun';

import Manifold from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';
import withdrawalProcessor from './withdrawalProcessor';
import betProcessor from './betProcessor';
import { handleManifoldTransfer, handleRailgunTransaction } from './railgun/utils';


const main = async() => {
  await Railgun.initialize();
  await database.initialize();
  depositProcessor.initialize();
  withdrawalProcessor.initialize();
  betProcessor.initialize();
  Manifold.onTransfer(handleManifoldTransfer);
  Railgun.onTransaction(handleRailgunTransaction);
};

main().catch(console.error);

export default main;