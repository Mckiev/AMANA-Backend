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

type PositionData = {
  hasNoShares: boolean;
  hasYesShares: boolean;
  totalShares: {
    NO: number;
    YES: number;
  };
};

const isPositionData = (value: unknown): value is PositionData => (
  isObjectRecord(value)
    && typeof value.hasNoShares === 'boolean'
    && typeof value.hasYesShares === 'boolean'
    && isObjectRecord(value.totalShares)
    && typeof value.totalShares.NO === 'number'
    && typeof value.totalShares.YES === 'number'
);

type ResponseJson = {
  success: boolean;
};

type BetResponseJson = ResponseJson & {
  isFilled: boolean;
  betId: string;
  shares: string;
  amount: number;
};

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

const fetchMyId = async (): Promise<string> => {
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
  return json.id;
}

function parceTransfer(transactions: unknown[]): ManifoldTransfer[] {
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
      return  parceTransfer(await response.json());
    } catch (error) {
      console.error('Error fetching managrams:', error);
      throw error;
    }

}

const onTransfer = (callback: ManifoldTransactionCallback): void => {

  // TODO: store and retrieve these with a database
  const handledTransferIds: string[] = [];

  const checkForTransfers = async () => {
    console.log('Checking for transfers...');
    const userId = await fetchMyId();
    const allTransfers = await fetchTransfers(userId);
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

  
 async function buyShares(marketID: string, yes_or_no: ShareType, amount: number, from_api_key: string = config.apiKey): Promise<[string, number]> {
  const buySharesResponse = await fetch(`https://api.manifold.markets/v0/bet`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${from_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contractId: marketID,
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
  return [json.betId, parseInt(json.shares)];
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

  const getMarketPosition = async (marketID: string, userID: string): Promise<[ShareType, number] | undefined>  => {
    const positionResponse = await fetch(`https://api.manifold.markets/v0/market/${marketID}/positions?userId=${userID}`, {
        method: 'GET',
        headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
        }
    });

    if (!positionResponse.ok) {
        throw new Error(`Error fetching market position: ${positionResponse.status}`);
    }

    try {
        // response is an array of positions, but we can only have zero or one position since we filter by  both user and market
        const positionData = await (await positionResponse.json())[0];


        if (!isPositionData(positionData)) {
        console.log('positionData is: ', positionData);
        throw new Error('Unexpected market position data type returned from Manifold API');
        }

        if (positionData.hasNoShares) {
        return [ShareType.no, positionData.totalShares.NO];
        }
        if (positionData.hasYesShares) {
        return [ShareType.yes, positionData.totalShares.YES];
        }
    } catch (e) {
        console.log('Error fetching market position:', e);
}

return undefined;

}

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


const sellShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<[string, number]> => {
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

  const json: BetResponseJson = await response.json();

  if (!isBetResponseJson(json)) {
    console.log('json is: ', json);
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to sell shares');
  }
  const mana_amount = Math.round(json.amount);
  console.log(`sold shares: ${shares_amount} for ${mana_amount} mana`);
  return [json.betId,  mana_amount];  
}

const buyNShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<number> => {
  let shares_bought = 0; 
  let prob = 0.5;
  let total_mana_spent = 0;
  let mana_order_amount = 0;
  while (shares_bought < shares_amount) {
      prob = await getMarketProb(marketId);
      mana_order_amount = Math.floor((shares_amount - shares_bought) * (prediction === ShareType.yes ? prob : 1 - prob));
      mana_order_amount = Math.max(mana_order_amount, 10);
      console.log(`prob = ${prob}, Buying for ${mana_order_amount} mana`);
      const n_shares = (await buyShares(marketId, prediction, mana_order_amount))[1];
      shares_bought += n_shares;
      console.log(`Bought ${n_shares} shares, total bought: ${shares_bought}`);
      total_mana_spent += mana_order_amount;
  }

  console.log('selling extra shares');
  const extra_shares = shares_bought - shares_amount;
  mana_order_amount = (await sellShares(marketId, prediction, extra_shares))[1];
  console.log(`Sold ${extra_shares} shares for ${mana_order_amount} mana`);
  shares_bought -= extra_shares;
  total_mana_spent += mana_order_amount;
  console.log(`total shares bought: ${shares_bought}`);
  return total_mana_spent;
}


// sells given number of shares, handling the case when we don't have enough shares
const closePosition = async (marketId: string, prediction: ShareType, amount: number): Promise<void> => {
  let mana_received = 0; 
  let extra_shares = 0;
  const position = await getMarketPosition(marketId, await fetchMyId());
  if (position === undefined) {
    console.log('No position found');
    return;
  }
  const [position_prediction, shares] = position;
  if ((position_prediction == prediction) && (shares >= amount)) {
    mana_received = (await sellShares(marketId, prediction, amount))[1];
  }
  if ((position_prediction == prediction) && (shares < amount)) {
    mana_received += (await sellShares(marketId, prediction, shares))[1];    
    extra_shares = amount - shares;
  }
  if (position_prediction != prediction) {
    extra_shares = amount;
  }
  if (extra_shares > 0) {
    const position_to_buy = (prediction == ShareType.no) ? ShareType.yes : ShareType.no;
    const mana_spent = await buyNShares(marketId, position_to_buy, extra_shares);
    mana_received += (extra_shares - mana_spent);
  }
  console.log(`closed position, received ${mana_received} mana`);
  return;
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
}