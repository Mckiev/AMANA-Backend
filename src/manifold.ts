import * as dotenv from 'dotenv';
import {ManifoldTransfer,
  isManifoldTransaction,
  isUserData,
  isResponseJson,
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

    const json = await managramResponse.json();

    if (!isResponseJson(json)) {
      throw new Error('Unexpected response type returned from Manifold API');
    }

    if (!json.success) {
      throw new Error('Failed to send Manifold transfer');
    }
  }
  
  // Makes a bet : Buys a number of YES or NO shares for the given market and amount



  // Sells a number of YES or NO shares for the given market and amount


  // // Fetches market ID by it's slug
  // export async function fetchMarketID(market_slug: string): Promise<string> {
  //   const marketDataResponse = await fetch(`https://api.manifold.markets/v0/user/${market_slug}`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Key ${apiKey}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
    
  //     if (!marketDataResponse.ok) {
  //       throw new Error(`Error fetching market ID: ${marketDataResponse.status}`);
  //     }
  
  //     const marketData= await marketDataResponse.json();
  //     if (!isMarketData(marketData)) {
  //       throw new Error('Unexpected market data type returned from Manifold API');
  //     }
  //     return marketData.id;
  //   } 



