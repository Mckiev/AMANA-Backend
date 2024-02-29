import { assert } from 'console';
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

type MarketData = {
  id: string;
  probability: number;
}

const isMarketData = (value: unknown): value is MarketData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.probability === 'number'
);

type ResponseJson = {
  success: boolean;
};

type BetResponseJson = ResponseJson & {
  isFilled: boolean;
  betId: string;
  shares: string;
  amount: string;
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
//   console.log('json response is: ', JSON.stringify(json));
  return [json.betId, parseInt(json.shares)];
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
        //TODO handle this better
        console.log('MarketSlug is: ', market_slug);
        throw new Error(`Error fetching market ID: ${marketDataResponse.status}`);
    }

    const marketData= await marketDataResponse.json();
    if (!isMarketData(marketData)) {
        throw new Error('Unexpected market data type returned from Manifold API');

    }
    return marketData.id;
}
  
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

// bet type :
//   {
//     id: 'bdSGBes0WW1yQgwGON1u',
//     fees: { creatorFee: 0, platformFee: 0, liquidityFee: 0 },
//     fills: [],
//     isApi: false,
//     amount: 0,
//     isAnte: false,
//     shares: 0,
//     userId: 'sCOvPc5J2sOacn0DYjwL7OAMzcV2',
//     outcome: 'NO',
//     isFilled: false,
//     userName: 'Ben Shindel',
//     limitProb: 0.46,
//     probAfter: 0.33962269592708333,
//     contractId: 'A319ydGB1B7f4PMOROL3',
//     loanAmount: 0,
//     probBefore: 0.33962269592708333,
//     visibility: 'public',
//     createdTime: 1704984300668,
//     isCancelled: false,
//     isChallenge: false,
//     orderAmount: 10000,
//     isRedemption: false,
//     userUsername: 'benshindel',
//     userAvatarUrl: 'https://lh3.googleusercontent.com/a/ALm5wu22VD_r1GJh-n-cEmVyjrKEFlOdTcYxeXuYzn_4Ag=s96-c'
//   }


type ManifoldBet = {
    id: string;
    isFilled: boolean;
    outcome: string;
    limitProb: number;
    contractId: string;
    isCancelled: boolean;
    };

const isManifoldBet = (value: unknown): value is ManifoldBet => (
    isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.isFilled === 'boolean'
    && typeof value.outcome === 'string'
    && typeof value.limitProb === 'number'
    && typeof value.contractId === 'string'
    && typeof value.isCancelled === 'boolean'
);
    
const isManifoldBetArray = (value: unknown): value is ManifoldBet[] => (
    Array.isArray(value) && value.every(isManifoldBet)
);


const fetchFirstMatchingMarketOrder = async (marketId: string, prediction: ShareType): Promise<[number, number]> => {
    const url = `https://api.manifold.markets/v0/bets?contractId=${marketId}&kinds=open-limit`;
    const headers = {  
        'Authorization': `Key ${config.apiKey}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(url, { headers });
    const json = await response.json();
    if (!isManifoldBetArray(json)) {
        throw new Error('Unexpected Manifold API response for "bets"');
    }

    if (prediction === ShareType.yes) {
            let filteredAndSorted = json
            .filter(obj => obj.outcome !== ShareType.no && !obj.isCancelled && !obj.isFilled) 
            .sort((a, b) => b.limitProb - a.limitProb);
        
        console.log('filteredAndSorted is: ', filteredAndSorted.slice(0, 5));
        return [0, 0];
    }
    return [0, 0];
}
async function timeFunctionExecution(func: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await func();
    const end = performance.now();
    return end - start;
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

const buyNShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<void> => {
    let shares_bought = 0;
    while (shares_bought < shares_amount-10) {
        let prob = await getMarketProb(marketId);
        const mana_amount = Math.ceil((shares_amount - shares_bought) * (prediction === ShareType.yes ? prob : 1 - prob));
        
        console.log(`prob = ${prob}, Buying for ${mana_amount} mana`);
        const [betId, shares] = await buyShares(marketId, prediction, mana_amount);
        console.log(`Bought ${shares} shares, total bought: ${shares_bought}`);
        shares_bought += shares;
    }
    console.log('Bought this many shares:', shares_bought);
    
}

const main = async () => {
    const marketId = await getMarketID('test-question-4c1ff3f827cb');
    buyNShares(marketId, ShareType.yes, 200);
}

timeFunctionExecution(main).then((executionTime) => {
    console.log('Execution time: ', executionTime);
}).catch(console.error);


