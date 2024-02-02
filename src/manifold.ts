import config from './config';

type ObjectRecord = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is ObjectRecord => (
  typeof value === 'object'
    && !Array.isArray(value)
    && value !== null
);

type ManifoldTransfer = {
  from: string;
  amount: string;
  memo: string;
};

type ManifoldTransactionJSON = {
  fromId: string;
  amount: number;
  data: {
    message: string;
  };
};

const isManifoldTransaction = (value: unknown): value is ManifoldTransactionJSON => (
  isObjectRecord(value)
    && typeof value.fromId === 'string'
    && typeof value.amount === 'number'
    && isObjectRecord(value.data)
    && typeof value.data.message === 'string'
);

type UserData = {
  id: string;
};

const isUserData = (value: unknown): value is UserData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
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

type BetResponseJson = {
  isFilled: boolean;
};

const isResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.success === 'boolean'
);
const isBetResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.isFilled === 'boolean'
);

// defines enum for 'yes' and 'no' values
enum ShareType {
  yes = 'YES',
  no = 'NO',
}



export default {
  fetchTransactions,
  sendTransfer,
  tradeShares,
  getMarketID,
  getUserID,
  ShareType
}



function parceTransfer(transactions: unknown[]): ManifoldTransfer[] {
  return transactions.map(transaction => {
    if (!isManifoldTransaction(transaction)) {
      throw new Error('Unexpected transaction type returned from Manifold API');
    }
    return {
      from: transaction.fromId, 
      amount: transaction.amount.toString(), 
      memo: transaction.data.message 
    }
  });
}

// Receives user id as an argument, with default value set to my user id.
 async function  fetchTransactions(userID: string = "6DLzPFOV0LelhuLPnCECIXqsIgN2" ): Promise<ManifoldTransfer[]> {
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
 async function sendTransfer(recipientUsername: string, amount: number, memo: string, from_api_key: string = config.mckievAPIKey): Promise<undefined> {
    
    const recipientUserId = await getUserID(recipientUsername);
    
    const managramResponse = await fetch('https://api.manifold.markets/v0/managram', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${from_api_key}`,
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
  }

  
 async function tradeShares(marketID: string, yes_or_no: ShareType, amount: number, from_api_key: string = config.apiKey): Promise<undefined> {
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
    throw new Error('Unexpected response type returned from Manifold API');
  }

  if (!json.isFilled) {
    throw new Error('Failed to buy shares');
  }
  
}

// Fetches market ID by it's slug
 async function getMarketID(market_slug: string): Promise<string> {
  const marketDataResponse = await fetch(`https://api.manifold.markets/v0/slug/${market_slug}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  
    if (!marketDataResponse.ok) {
      throw new Error(`Error fetching market ID: ${marketDataResponse.status}`);
    }

    const marketData= await marketDataResponse.json();
    if (!isMarketData(marketData)) {
      throw new Error('Unexpected market data type returned from Manifold API');

    }
    return marketData.id;
  }