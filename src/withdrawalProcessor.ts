import manifold from './manifold';
import config from './config';
import database from './database';
import constants from './constants';


const processWithdrawals = async (): Promise<void> => {
    const withdrawal = await database.getQueuedWithdrawal();
    if (withdrawal) {
      if (withdrawal.amount > constants.MANIFOLD.maxWithdrawal) {
        console.error('Withdrawal amount exceeds maximum');
      } else {
        const amount = Number(withdrawal.amount);
        const memo = 'AMANA Withdrawal';
        const manifoldTransferId = await manifold.sendTransfer(withdrawal.manifoldUsername, amount, memo);
        database.updateWithdrawalToConfirmed(withdrawal.id, manifoldTransferId);
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