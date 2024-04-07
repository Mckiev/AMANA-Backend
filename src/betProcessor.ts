import Manifold from './manifold';
import database from './database';
import constants from './constants';


const processBets = async (): Promise<void> => {
  console.log('checking for bet to process');
  const bet = await database.getQueuedBet();
  if (bet === undefined) {
    // call processRedemption in case no bet is found
    setTimeout(processRedemption, 1000);
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
        database.updateBetToPlaced(bet.id, betId, Math.floor(n_shares));
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

const processRedemption = async (): Promise<void> => {
  console.log('checking for redemption to process');
  const redemption = await database.getQueuedRedemption();
  if (redemption === undefined) {
    // getting back to bet processing in case no redemption is found
    setTimeout(processBets, 1000);
    return;
  }
  try {
    console.log('Processing redemption', redemption);
    const marketResolved = await Manifold.isMarketResolved(redemption.marketId);
    if (marketResolved) {
      const resolution = await Manifold.getMarketResolution(redemption.marketId);
      if (resolution !== redemption.prediction) {
        console.log('Market resolved against us, no shares to sell');
        await database.updateBetToRedeemed(redemption.id);
      }
      else {
        console.log('Market resolved in our favor, paying out amana');
        const railgunAddress = redemption.redemptionAddress;
        const manifoldUserId = await Manifold.fetchMyId();
        const manifoldTransferId = 'redemption:marketResolved';
        const payout = Number(redemption.nShares);
        await database.createDeposit(railgunAddress, manifoldTransferId, manifoldUserId, BigInt(payout)); 
    }
  }
    const [received_mana, bet_array] = await Manifold.closePosition(redemption.marketId, redemption.prediction, Number(redemption.nShares));
    if (received_mana) {
      for (const bet of bet_array) {
        await database.createRedemptionTransaction(redemption.id, bet);
      }
      // Using deposit function to process redemption
      const railgunAddress = redemption.redemptionAddress;
      const manifoldUserId = await Manifold.fetchMyId();
      // using this to distingush between mana deposits and bet redemptions
      const manifoldTransferId = 'redemption:' + redemption.betId;

      await database.createDeposit(railgunAddress, manifoldTransferId, manifoldUserId, BigInt(received_mana));
      console.log('Redemption processed');
      await database.updateBetToRedeemed(redemption.id);
    } else {
      throw new Error('Failed to redeem');
    }
  } catch (e: unknown) {
    console.warn('Failed to process a redemption correctly');
    console.log(e);
    database.updateBetToFailed(redemption.id);
  }
  setTimeout(processBets, 1000);
  return;
}

export default {
  initialize,
};