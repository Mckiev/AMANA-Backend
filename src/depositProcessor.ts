import database from "./database";
import Manifold from "./manifold";
import * as Railgun from "./railgun/railgun";

const processDeposits = async (): Promise<void> => {
  const deposit = await database.getQueuedDeposit();
  if (deposit) {
    try {
      const username = await Manifold.getUsername(deposit.manifoldUserId);
      const memo = `DEPOSIT FROM ${username}`;
      const fromWallet = Railgun.getWallet();
      const transaction = await Railgun.sendTransfer(fromWallet.id, deposit.railgunAddress, memo, deposit.amount);
      await database.updateDepositToSubmitted(deposit.id);
      await transaction.wait(3);
      await database.updateDepositToConfirmed(deposit.id);
    } catch (e: unknown) {
      console.log("failed to process deposit", e);
      await database.updateDepositToFailed(deposit.id);
    }
  }
  setTimeout(processDeposits, 1000);
};

const initialize = () => {
  processDeposits();
};

export default {
  initialize,
};