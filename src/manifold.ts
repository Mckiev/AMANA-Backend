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
  shares: string;
};

const isResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.success === 'boolean'
);

const isBetResponseJson = (value: unknown): value is BetResponseJson => (
  isObjectRecord(value)
    && typeof value.isFilled === 'boolean'
    && typeof value.betId === 'string'
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

  
 async function tradeShares(marketID: string, yes_or_no: ShareType, amount: number, from_api_key: string = config.apiKey): Promise<[string, number]> {
  const tradeSharesResponse = await fetch(`https://api.manifold.markets/v0/bet`, {
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

  if (!tradeSharesResponse.ok) {
    // Log or capture the error response body
    const errorBody = await tradeSharesResponse.json();
    console.error('Error response body:', errorBody);
    throw new Error(`Error buying shares: ${tradeSharesResponse.status} - ${errorBody.message}`);
  }

  const json: BetResponseJson = await tradeSharesResponse.json();

  console.log(json);
  if (!isBetResponseJson(json)) {
    console.log('json is: ', json);
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to buy shares');
  }
  console.log('json response is: ', JSON.stringify(json));
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

export default {
  fetchMyId,
  fetchTransfers,
  sendTransfer,
  tradeShares,
  getMarketID,
  getUserID,
  getUsername,
  onTransfer,
  ShareType
}