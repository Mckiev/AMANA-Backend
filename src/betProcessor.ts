import Manifold from './manifold';
import database from './database';
import constants from './constants';


const processBets = async (): Promise<void> => {
  console.log('checking for bet to process');
  const bet = await database.getQueuedBet();
  console.log('bet to process', bet);
  if (bet === undefined) {
    setTimeout(processBets, 1000);
    return;
  }
  try {
    console.log('Processing bet', bet);
    if (bet.amount > constants.MANIFOLD.maxBet) {
      throw new Error('Bet amount exceeds maximum');
    } else {
      const {betId, n_shares} = await Manifold.buyShares(bet.marketId, bet.prediction, Number(bet.amount));
      if (betId === undefined) {
        throw new Error('Failed to place bet');
      } else {
        database.updateBetToPlaced(bet.id, betId, n_shares);
      }
    }
  } catch (e: unknown) {
    console.warn('Failed to process a bet correctly');
    console.log(e);
    database.updateBetToFailed(bet.id);
  }
  setTimeout(processBets, 1000);
};

const initialize = () => {
processBets();
};

export default {
initialize,
};