import * as Railgun from './railgun/railgun';

import Manifold from "./manifold";
import database from './database';
import depositProcessor from './depositProcessor';
import withdrawalProcessor from './withdrawalProcessor';
import betProcessor from './betProcessor';
import { handleManifoldTransfer, handleRailgunTransaction } from './railgun/utils';
import { stopRailgunEngine } from '@railgun-community/wallet';
// import config from './config';
// import wait from './utils/wait';

const restartEngine = async() => {
  console.log('Restarting Railgun engine...');
  await stopRailgunEngine();
  await Railgun.initialize();
}

const main = async() => {
  await Railgun.initialize();
  await database.initialize();
  depositProcessor.initialize();
  withdrawalProcessor.initialize();
  betProcessor.initialize();
  Manifold.onTransfer(handleManifoldTransfer);
  Railgun.onTransaction(handleRailgunTransaction);
  // interim solution to restart the engine every 5 minutes, to keep it running
  setInterval(restartEngine, 1000 * 5 * 60);
};

main().catch(console.error);

export default main;