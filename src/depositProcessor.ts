import database from "./database";
import Manifold from "./manifold";
import * as Railgun from "./railgun/railgun";


const processDeposits = async (): Promise<void> => {
  const deposit = await database.getQueuedDeposit();
  if (deposit) {
    try {
      console.log('Processing deposit', deposit);
      const username = await Manifold.getUsername(deposit.manifoldUserId);
      const memo = `DEPOSIT FROM ${username}`;
      const maxBonus = BigInt(200);
      let bonusAmount = BigInt(0);
      const bonusEligible = await database.isBonusEligible(deposit.manifoldUserId);
      if (bonusEligible) {
        bonusAmount = (deposit.amount < maxBonus) ? deposit.amount : maxBonus;
      }
      const totalAmount = deposit.amount + bonusAmount;
      const fromWallet = Railgun.getWallet();
      const transaction = await Railgun.sendTransfer(fromWallet.id, deposit.railgunAddress, memo, totalAmount );
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