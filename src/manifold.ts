import config from './config';
import { isObjectRecord } from './types';
import wait from './utils/wait';

export type ManifoldTransfer = {
  id: string;
  from: string;
  amount: bigint;
  memo: string;
};

type ManifoldTransactionJSON = {
  id: string;
  fromId: string;
  amount: number;
  data: {
    message: string;
  };
};


export type Bet = {
  betId: string,
  marketId:string,
  prediction:ShareType,
  n_shares: number,
  mana_amount: number
}

const isManifoldTransaction = (value: unknown): value is ManifoldTransactionJSON => (
  isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.fromId === 'string'
    && typeof value.amount === 'number'
    && isObjectRecord(value.data)
    && typeof value.data.message === 'string'
);

type UserData = {
  id: string;
  username: string;
};

const isUserData = (value: unknown): value is UserData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.username === 'string'
);

type MarketData = {
  id: string;
  probability: number;
}

const isMarketData = (value: unknown): value is MarketData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
);

type ResponseJson = {
  success: boolean;
};

type BetResponseJson = ResponseJson & {
  isFilled: boolean;
  betId: string;
  shares: number;
  amount: number;
  outcome: ShareType;
};

type ErrorResponse = {
  message: string;
};

const isErrorResponse = (value: unknown): value is ErrorResponse => (
  isObjectRecord(value) && typeof value.message === 'string'
);


const isResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.success === 'boolean'
);

const isBetResponseJson = (value: unknown): value is BetResponseJson => (
  isObjectRecord(value)
    && typeof value.isFilled === 'boolean'
    && typeof value.betId === 'string'
    && typeof value.shares === 'number'
);

export enum ShareType {
  yes = 'YES',
  no = 'NO',
}

export type ManifoldTransactionCallback = (transfer: ManifoldTransfer) => void;

let myIdCached: string | undefined;
const fetchMyId = async (): Promise<string> => {
  if (myIdCached !== undefined) {
    return myIdCached;
  }
  const url = `https://api.manifold.markets/v0/me`;
  const headers = {
    'Authorization': `Key ${config.apiKey}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch(url, { headers });
  const json = await response.json();
  if (!isUserData(json)) {
    throw new Error('Unexpected Manifold API response for "me" user');
  }
  myIdCached = json.id;
  return json.id;
}

function parseTransfer(transactions: unknown[]): ManifoldTransfer[] {
  return transactions.map(transaction => {
    if (!isManifoldTransaction(transaction)) {
      throw new Error('Unexpected transaction type returned from Manifold API');
    }
    return {
      id: transaction.id,
      from: transaction.fromId, 
      amount: BigInt(transaction.amount),
      memo: transaction.data.message 
    }
  });
}

// Receives user id as an argument, with default value set to my user id.
 async function  fetchTransfers(userID: string): Promise<ManifoldTransfer[]> {
    const url = `https://api.manifold.markets/v0/managrams?toId=${userID}`;
    const headers = {
      'Authorization': `Key ${config.apiKey}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log('url and headers were: ', url, headers)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return  parseTransfer(await response.json());
    } catch (error) {
      console.error('Error fetching managrams:', error);
      return [];
    }

}

const onTransfer = (callback: ManifoldTransactionCallback): void => {

  // TODO: store and retrieve these with a database
  const handledTransferIds: string[] = [];

  const checkForTransfers = async () => {
    console.log('Checking for Manifold transfers...');
    const userId = await fetchMyId();
    console.log('userId: ', userId);
    const username = await getUsername(userId);
    console.log('username: ', username);
    const allTransfers = await fetchTransfers(userId);
    console.log('allTransfers: ', allTransfers.slice(-5));
    allTransfers.forEach(transfer => {
      const alreadyHandled = handledTransferIds.includes(transfer.id);
      if (!alreadyHandled) {
        handledTransferIds.push(transfer.id);
        callback(transfer);
      }
    });
    setTimeout(checkForTransfers, 1000);
  };

  checkForTransfers();
};

// Fetches userID by username

 async function getUserID(username: string): Promise<string> {
  const userIdResponse = await fetch(`https://api.manifold.markets/v0/user/${username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  
    if (!userIdResponse.ok) {
      throw new Error(`Error fetching user ID: ${userIdResponse.status}`);
    }

    const userData = await userIdResponse.json();
    if (!isUserData(userData)) {
      throw new Error('Unexpected user data type returned from Manifold API');
    }
    return userData.id;
  }

// Sends transfer to username
 async function sendTransfer(
  recipientUsername: string,
  amount: number,
  memo: string,
): Promise<string> {
    
    const recipientUserId = await getUserID(recipientUsername);
    
    const managramResponse = await fetch('https://api.manifold.markets/v0/managram', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toIds: [recipientUserId],
        amount: amount,
        message: memo
      })
    });
  
    if (!managramResponse.ok) {
        // Log or capture the error response body
        const errorBody = await managramResponse.json();
        console.error('Error response body:', errorBody);
        throw new Error(`Error sending managram: ${managramResponse.status} - ${errorBody.message}`);
    }

    const json: ResponseJson = await managramResponse.json();

    if (!isResponseJson(json)) {
      throw new Error('Unexpected response type returned from Manifold API');
    }

    if (!json.success) {
      throw new Error('Failed to send Manifold transfer');
    }

    await wait(5_000);
    const transfers = await fetchTransfers(recipientUserId);
    const transferId = transfers.find(transfer => transfer.memo === memo)?.id;
    if (transferId === undefined) {
      throw new Error('Unable to find sent transfer in recent history');
    }
    return transferId;
  }

  

// Fetches market ID by it's slug
 async function getMarketID(marketUrl: string): Promise<string> {
  // stripping slug to everything after the last slash if there is one
  const marketSlug = marketUrl.split('/').pop();
  const marketDataResponse = await fetch(`https://api.manifold.markets/v0/slug/${marketSlug}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  
    if (!marketDataResponse.ok) {
      //TODO handle this better
      console.log('MarketSlug is: ', marketSlug);
      throw new Error(`Error fetching market ID: ${marketDataResponse.status}`);
    }

    const marketData= await marketDataResponse.json();
    if (!isMarketData(marketData)) {
      throw new Error('Unexpected market data type returned from Manifold API');

    }
    return marketData.id;
  }
  

  const getUsername = async (userId: string): Promise<string> => {
    const userDataResponse = await fetch(`https://api.manifold.markets/v0/user/by-id/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  
    if (!userDataResponse.ok) {
      throw new Error(`Error fetching username: ${userDataResponse.status}`);
    }
  
    const userData= await userDataResponse.json();
    if (!isUserData(userData)) {
      throw new Error('Unexpected user type returned from Manifold API');
    }
    return userData.username;
  };

const getMarketProb = async (marketId: string): Promise<number> => {
  const url = `https://api.manifold.markets/v0/market/${marketId}`;  
  const headers = {  
      'Authorization': `Key ${config.apiKey}`,
      'Content-Type': 'application/json'
  };
  const response = await fetch(url, { headers });
  const json = await response.json();
  if (!isMarketData(json)) {
      throw new Error('Unexpected Manifold API response for "market"');
  }  
  return json.probability;
}

const getMarketPosition = async (marketId: string, userId: string): Promise<[ShareType, number] | undefined> => {
  // It takes some time for the API to update the position after a transaction
  // Maybe aroud 5 seconds
  const url = `https://api.manifold.markets/v0/bets?contractId=${marketId}&userId=${userId}`;
  const headers = {
    'Authorization': `Key ${config.apiKey}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch(url, { headers });
  const json = await response.json();

  if (!Array.isArray(json)) {
    throw new Error('Unexpected response  type returned from Manifold API');
  }

  const yesBets = json.filter((bet: BetResponseJson) => bet.outcome === 'YES');
  const noBets = json.filter((bet: BetResponseJson) => bet.outcome === 'NO');
  const yesShares = yesBets.reduce((total: number, bet: BetResponseJson) => total + bet.shares, 0);
  const noShares = noBets.reduce((total: number, bet: BetResponseJson) => total + bet.shares, 0);
  console.log('yesShares: ', yesShares);
  console.log('noShares: ', noShares);
  if (Math.max(yesShares, noShares) < 1) {
    return undefined;
  }
  if (yesShares > noShares) {
    return [ShareType.yes, yesShares];
  }
  if (noShares > yesShares) {
    return [ShareType.no, noShares];
  }
  return undefined;
}

// 1. Buy yes/no with MANA
//   -> Buy yes/no => sell no/yes, if we have them
// 2. Sell yes/no by share quantity if we have them


// Desired:
// Buy yes with MANA (bet) <-- easy, use (1)
// Buy no with MANA (bet) <-- easy, use (1)


// Buy yes by share quantity (redeem) <-- NOT easy
// Buy no by share quantity (redeem) <-- NOT easy


// 

// Note: Need to test what response we get from the API when, e.g.
// We own 80 no shares, and buy 100 yes shares
async function buyShares(marketId: string, yes_or_no: ShareType, amount: number, from_api_key: string = config.apiKey): Promise<Bet> {
  const buySharesResponse = await fetch(`https://api.manifold.markets/v0/bet`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${from_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contractId: marketId,
      outcome: yes_or_no,
      amount: amount,
    })
  });

  if (!buySharesResponse.ok) {
    // Log or capture the error response body
    const errorBody = await buySharesResponse.json();
    console.error('Error response body:', errorBody);
    throw new Error(`Error buying shares: ${buySharesResponse.status} - ${errorBody.message}`);
  }

  const json: BetResponseJson = await buySharesResponse.json();

  if (!isBetResponseJson(json)) {
    console.log('json is: ', json);
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to buy shares');
  }
  const n_shares = Math.floor(json.shares);
  const mana_amount = Math.floor(json.amount);
  const bet: Bet = { betId: json.betId, marketId, prediction: yes_or_no, n_shares, mana_amount};
  return bet;
}

const sellShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<Bet | null> => {
  const url = `https://api.manifold.markets/v0/market/${marketId}/sell`;
  const headers = {
    'Authorization': `Key ${config.apiKey}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      outcome: prediction,
      shares: shares_amount
    })
  });

  const json = await response.json();
  console.log(json)

  if (isErrorResponse(json)) {
    // Check if the error message matches the specific format
    const errorRegex = /You can only sell up to ([\d.e+-]+) shares\./;
    const match = json.message.match(errorRegex);

    if (match) {
      // Extract the maximum number of shares from the error message
      const maxShares = parseFloat(match[1]);
      
      // Sell the maximum number of shares
      return await sellShares(marketId, prediction, maxShares);
    } else if (json.message === `You don't have any ${prediction} shares to sell.`) {
      // If the user doesn't have any shares to sell, return null
      return null;
    } else {
      // If the error message doesn't match the expected format, throw an error
      throw new Error(`Unexpected error: ${json.message}`);
    }
  }

  if (!isBetResponseJson(json)) {
    console.log('json is: ', json);
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to sell shares');
  }

  // rounding towards smaller number using Math.floor (since the numbers are negative)
  const mana_amount = Math.ceil(json.amount);
  const n_shares = Math.ceil(json.shares);

  console.log(`sold shares: ${n_shares} for ${mana_amount} mana`);
  
  const bet: Bet = { betId: json.betId, marketId, prediction, n_shares, mana_amount };
  return bet;  
};

const sellAllShares = async (marketId: string): Promise<Bet> => {
  const url = `https://api.manifold.markets/v0/market/${marketId}/sell`;
  const headers = {
    'Authorization': `Key ${config.apiKey}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const json: BetResponseJson = await response.json();

  if (!isBetResponseJson(json)) {
    console.log('json is: ', json);
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to sell shares');
  }
  console.log('json is: ', json);
  const mana_amount = Math.floor(json.amount);
  const n_shares = Math.floor(json.shares);
  const shares_type = json.outcome;
  console.log(`sold ${shares_type} shares: ${-n_shares} for ${-mana_amount} mana`);

  const bet: Bet = { betId: json.betId, marketId, prediction: shares_type, n_shares, mana_amount };
  return bet; 
}

const buyNShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<Bet[]> => {
  // This function assumes that we don't have shares of the opposite type
  // It will buy shares until we have more then the requested shares_amount, and then sell the extra shares
  let shares_bought = 0;
  let prob = 0.5;
  let mana_amount = 0;
  const bet_array: Bet[] = [];
  while (shares_bought < shares_amount) {
      prob = await getMarketProb(marketId);
      mana_amount = Math.floor((shares_amount - shares_bought) * (prediction === ShareType.yes ? prob : 1 - prob));
      mana_amount += 10; // aiming to overshoot a little
      console.log(`prob = ${prob}, Buying ${prediction} shares for ${mana_amount} mana`);
      const {betId, n_shares} = await buyShares(marketId, prediction, mana_amount);
      const bet = { betId, marketId, prediction, n_shares, mana_amount }
      bet_array.push(bet);
      shares_bought += n_shares;
      console.log(`Bought ${n_shares} shares, total bought: ${shares_bought}`);
  }

  console.log('selling extra shares');
  const extra_shares = shares_bought - shares_amount;
  const sale_result : Bet | null  = await sellShares(marketId, prediction, extra_shares);
  if (sale_result === null) {
    console.log(`Couldn't sell extra shares: no shares of the requested type available`);
  } else {
    bet_array.push(sale_result);
    console.log(`Sold ${extra_shares} shares for ${-sale_result.mana_amount} mana`);
    shares_bought -= extra_shares;  //mana_amount is negative, because we are receiving mana, rather than spending it
  }
  console.log(`total shares bought: ${shares_bought}`);
  return bet_array;
}

// 2 users: Alice, Bob
// Alice buys 100 Yes shares
// Bob buys 50 No shares
// We now have 50 Yes shares
// Alice requests to redeem 100 Yes shares
//   -> We sell the 50 Yes shares
//     -> Proceeds go to Alice
//   -> We buy 50 No shares
//     -> (1 - price) * 50 shares goes to Alice

// sells given number of shares, handling the case when we don't have enough shares
const closePosition = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<[number, Bet[]]> => {
  let mana_received = 0; 
  let shares_to_buy = shares_amount;
  let bet_array: Bet[] = [];
  // first we are trying to sell the shares we have, which will either close the position, or sell all of the available shares
  const sale_result: Bet | null  = await sellShares(marketId, prediction, shares_amount);
  if (sale_result !== null) {
    bet_array.push(sale_result);
    // sale_result.shares is negative, because we are selling shares
    shares_to_buy += sale_result.n_shares;
    // mana_amount is negative, because we are receiving mana, rather than spending it
    mana_received -= sale_result.mana_amount;
  } else {
    console.log(`Couldn't sell shares: no shares of the requested type available`);
  }

  if (shares_to_buy > 1) {
    // after the sale we did above, we shouldn't have any shares of the requested type

    // If we have sold our manifold position, but need more shares to cover the requested amount
    // we buy the remaining shares of the opposite type
    const reverse_prediction = (prediction == ShareType.no) ? ShareType.yes : ShareType.no;
    const purchase_bet_array = await buyNShares(marketId, reverse_prediction, shares_to_buy);
    bet_array = bet_array.concat(purchase_bet_array);
    const mana_spent = purchase_bet_array.reduce((total, bet) => total + bet.mana_amount, 0);
    // in effect, we have redeemed the YES+NO shares, and received shares_to_buy amount of mana
    mana_received += (shares_to_buy - mana_spent);
  }
  console.log(`closed position, received ${mana_received} mana`);
  return [mana_received, bet_array];
}

export default {
  fetchMyId,
  fetchTransfers,
  sendTransfer,
  buyShares,
  getMarketID,
  getUserID,
  getUsername,
  onTransfer,
  ShareType,
  getMarketPosition,
  buyNShares,
  closePosition,
  sellShares,
  sellAllShares,
}