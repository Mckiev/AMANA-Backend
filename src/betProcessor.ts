import Manifold from './manifold';
import database from './database';
import constants from './constants';
import generateId from './utils/generateId';
import { isObjectRecord } from './types';


const processBets = async (): Promise<void> => {
    const bet = await database.getQueuedBet();
    if (bet) {
      if (bet.amount > constants.MANIFOLD.maxBet) {
        // TODO: handle this better
        console.error('Bet amount exceeds maximum');
      } else {
        try {
          const manifoldBetId = await Manifold.tradeShares(bet.marketId, bet.prediction, Number(bet.amount));
          database.updateBetToConfirmed(bet.id, manifoldBetId);
        } catch (e: unknown) {
          console.warn('Failed to process a bet correctly');
          console.log(e);
        }
      }
    }
};

const initialize = () => {
processBets();
};

export default {
initialize,
};