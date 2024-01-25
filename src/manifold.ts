import * as dotenv from 'dotenv';
import {ManifoldTransfer,
  isManifoldTransaction,
  isUserData,
  isResponseJson,
  isBetResponseJson,
  isMarketData,
  ShareType,
  BetResponseJson,
  ResponseJson,
} from '../src/types';

dotenv.config();
const apiKey = process.env.MANIFOLD_BOT_API_KEY ?? '';
const mckievAPIKey = process.env.MANIFOLD_MCKIEV_API_KEY ?? '';


function parseManifoldTransfers(transactions: unknown[]): ManifoldTransfer[] {
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
export async function  fetchManifoldTransactions(userID: string = "6DLzPFOV0LelhuLPnCECIXqsIgN2" ): Promise<ManifoldTransfer[]> {
    const url = `https://api.manifold.markets/v0/managrams?toId=${userID}`;
    const headers = {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log('url and headers were: ', url, headers)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return  parseManifoldTransfers(await response.json());
    } catch (error) {
      console.error('Error fetching managrams:', error);
      throw error;
    };

};

// Fetches userID by username

export async function fetchUserID(username: string): Promise<string> {
  const userIdResponse = await fetch(`https://api.manifold.markets/v0/user/${username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
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
export async function sendTransferToUsername(recipientUsername: string, amount: number, memo: string, from_api_key: string = mckievAPIKey): Promise<undefined> {
    
    const recipientUserId = await fetchUserID(recipientUsername);
    
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

  
export async function tradeShares(marketID: string, yes_or_no: ShareType, amount: number, from_api_key: string = apiKey): Promise<undefined> {
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
export async function fetchMarketID(market_slug: string): Promise<string> {
  const marketDataResponse = await fetch(`https://api.manifold.markets/v0/slug/${market_slug}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
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



