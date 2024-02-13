import Manifold from './manifold';
import database from './database';
import constants from './constants';


const processBets = async (): Promise<void> => {
    const bet = await database.getQueuedBet();
    if (bet) {
      console.log('Processing bet', bet);
      if (bet.amount > constants.MANIFOLD.maxBet) {
        // TODO: handle this better
        console.error('Bet amount exceeds maximum');
      } else {
        try {
          const [manifoldBetId, nShares] = await Manifold.tradeShares(bet.marketId, bet.prediction, Number(bet.amount));
          if (manifoldBetId === undefined) {
            throw new Error('Failed to place bet');
            //TODO - change bet status to failed
          } else {  
          database.updateBetToPlaced(bet.id, manifoldBetId, nShares);
          }
        } catch (e: unknown) {
          console.warn('Failed to process a bet correctly');
          //TODO - change bet status to failed
          console.log(e);
        }
      }
    }
    setTimeout(processBets, 1000);
};

const initialize = () => {
processBets();
};

export default {
initialize,
};