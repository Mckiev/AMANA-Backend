import { createRailgunWallet as createWallet } from '@railgun-community/wallet';
import main from '../src/main';
import * as Railgun from '../src/railgun/railgun';
import Manifold from '../src/manifold';
import config from '../src/config';
import wait from '../src/utils/wait';

// This test whether the function fetchManifoldTransactions() returns a non empty transaction list from Manifold.
describe.skip('Withdrawal processing', () => {

  beforeAll(async () => {
    // Initialize the service
    await main();
  }, 60 * 1000);

  it('should process a withdrawal request', async () => {
    const railgunWalletInfo = await createWallet(config.encryptionKey, config.userMnemonic, Railgun.creationBlockNumberMap);
    console.log('railgunWalletInfo address', railgunWalletInfo.railgunAddress);
    Railgun.sendTransfer(railgunWalletInfo.id, Railgun.getWallet().getAddress(), 'withdraw:mckiev', 12n);
    await wait(60 * 1000);
    const recipientUserId = await Manifold.getUserID('mckiev');
    const transactions = await Manifold.fetchTransfers(recipientUserId);
    console.log('transactions');
    console.log(transactions);
  }, 120 * 1000);
});
