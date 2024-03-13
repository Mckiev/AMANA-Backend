import manifold from './manifold';
import database from './database';
import constants from './constants';
import generateId from './utils/generateId';
import { isObjectRecord } from './types';


const processWithdrawals = async (): Promise<void> => {
    const withdrawal = await database.getQueuedWithdrawal();
    if (withdrawal) {
      try {
        if (withdrawal.amount > constants.MANIFOLD.maxWithdrawal) {
          console.error('Withdrawal amount exceeds maximum');
        } else {
          const amount = Number(withdrawal.amount);
          const memo = `AMANA Withdrawal #${generateId().slice(0, 8)}`;
          const manifoldTransferId = await manifold.sendTransfer(withdrawal.manifoldUsername, amount, memo);
          database.updateWithdrawalToConfirmed(withdrawal.id, manifoldTransferId);
        }
      } catch (e: unknown) {
        console.warn('Failed to process a withdrawal correctly');
        console.log(e);
        if (isObjectRecord(e)) {
          if (e.message === 'Unable to find sent transfer in recent history') {
            database.updateWithdrawToFailedToFind(withdrawal.id);
          } else {
            database.updateWithdrawToFailedToSend(withdrawal.id);
          }
        }
      }
    }
    setTimeout(processWithdrawals, 1000);
  };
  
  const initialize = () => {
    processWithdrawals();
  };
  
  export default {
    initialize,
  };