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
  setTimeout(restartEngine, 1000 * 5 * 60);
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