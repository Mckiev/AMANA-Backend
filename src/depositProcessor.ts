import database from "./database";
import manifold from "./manifold";
import { sendTransfer } from "./railgun/self-transfer";


const processDeposits = async (): Promise<void> => {
  const deposit = await database.getQueuedDeposit();
  if (deposit) {
    const username = await manifold.getUsername(deposit.manifolUserId);
    const memo = `DEPOSIT FROM ${username}`;
    const transaction = await sendTransfer(deposit.railgunAddress, memo, deposit.amount);
    await database.updateDepositToSubmitted(deposit.id);
    await transaction.wait(3);
    await database.updateDepositToConfirmed(deposit.id);
  }
  setTimeout(processDeposits, 1000);
};

const initialize = () => {
  processDeposits();
};

export default {
  initialize,
};