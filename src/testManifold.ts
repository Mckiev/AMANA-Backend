import { assert } from 'console';
import config from './config';
import { isObjectRecord } from './types';
import wait from './utils/wait';
import Manifold, { ShareType } from "./manifold";
import manifold from './manifold';

// export type ManifoldTransfer = {
//   id: string;
//   from: string;
//   amount: bigint;
//   memo: string;
// };

// type ManifoldTransactionJSON = {
//   id: string;
//   fromId: string;
//   amount: number;
//   data: {
//     message: string;
//   };
// };

// const isManifoldTransaction = (value: unknown): value is ManifoldTransactionJSON => (
//   isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.fromId === 'string'
//     && typeof value.amount === 'number'
//     && isObjectRecord(value.data)
//     && typeof value.data.message === 'string'
// );

// type UserData = {
//   id: string;
//   username: string;
// };

// const isUserData = (value: unknown): value is UserData => (
//   isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.username === 'string'
// );



// type MarketData = {
//   id: string;
//   probability: number;
// }

// const isMarketData = (value: unknown): value is MarketData => (
//   isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.probability === 'number'
// );

// type ResponseJson = {
//   success: boolean;
// };

// type BetResponseJson = ResponseJson & {
//   isFilled: boolean;
//   betId: string;
//   shares: string;
//   amount: string;
// };

// const isResponseJson = (value: unknown): value is ResponseJson => (
//   isObjectRecord(value)
//     && typeof value.success === 'boolean'
// );

// const isBetResponseJson = (value: unknown): value is BetResponseJson => (
//   isObjectRecord(value)
//     && typeof value.isFilled === 'boolean'
//     && typeof value.betId === 'string'
// );

// export enum ShareType {
//   yes = 'YES',
//   no = 'NO',
// }


// const fetchMyId = async (): Promise<string> => {
//   const url = `https://api.manifold.markets/v0/me`;
//   const headers = {
//     'Authorization': `Key ${config.apiKey}`,
//     'Content-Type': 'application/json'
//   };
//   const response = await fetch(url, { headers });
//   const json = await response.json();
//   if (!isUserData(json)) {
//     throw new Error('Unexpected Manifold API response for "me" user');
//   }
//   return json.id;
// }

  


//   const json: BetResponseJson = await buySharesResponse.json();

//   if (!isBetResponseJson(json)) {
//     console.log('json is: ', json);
//     throw new Error('Unexpected response type returned from Manifold API');
//   }

//   if (!json.isFilled) {
//     throw new Error('Failed to buy shares');
//   }
// //   console.log('json response is: ', JSON.stringify(json));
//   return [json.betId, parseInt(json.shares)];
// }



// // Fetches market ID by it's slug
// async function getMarketID(market_slug: string): Promise<string> {
//     const marketDataResponse = await fetch(`https://api.manifold.markets/v0/slug/${market_slug}`, {
//         method: 'GET',
//         headers: {
//         'Authorization': `Key ${config.apiKey}`,
//         'Content-Type': 'application/json'
//         }
//     });

//     if (!marketDataResponse.ok) {
//         //TODO handle this better
//         console.log('MarketSlug is: ', market_slug);
//         throw new Error(`Error fetching market ID: ${marketDataResponse.status}`);
//     }

//     const marketData= await marketDataResponse.json();
//     if (!isMarketData(marketData)) {
//         throw new Error('Unexpected market data type returned from Manifold API');

//     }
//     return marketData.id;
// }
  
// const getMarketPosition = async (marketID: string, userID: string): Promise<[ShareType, number] | undefined>  => {
//     const positionResponse = await fetch(`https://api.manifold.markets/v0/market/${marketID}/positions?userId=${userID}`, {
//         method: 'GET',
//         headers: {
//         'Authorization': `Key ${config.apiKey}`,
//         'Content-Type': 'application/json'
//         }
//     });

//     if (!positionResponse.ok) {
//         throw new Error(`Error fetching market position: ${positionResponse.status}`);
//     }

//     try {
//         // response is an array of positions, but we can only have zero or one position since we filter by  both user and market
//         const positionData = await (await positionResponse.json())[0];


//         if (!isPositionData(positionData)) {
//         console.log('positionData is: ', positionData);
//         throw new Error('Unexpected market position data type returned from Manifold API');
//         }

//         if (positionData.hasNoShares) {
//         return [ShareType.no, positionData.totalShares.NO];
//         }
//         if (positionData.hasYesShares) {
//         return [ShareType.yes, positionData.totalShares.YES];
//         }
//     } catch (e) {
//         console.log('Error fetching market position:', e);
// }

// return undefined;

// }

// // bet type :
// //   {
// //     id: 'bdSGBes0WW1yQgwGON1u',
// //     fees: { creatorFee: 0, platformFee: 0, liquidityFee: 0 },
// //     fills: [],
// //     isApi: false,
// //     amount: 0,
// //     isAnte: false,
// //     shares: 0,
// //     userId: 'sCOvPc5J2sOacn0DYjwL7OAMzcV2',
// //     outcome: 'NO',
// //     isFilled: false,
// //     userName: 'Ben Shindel',
// //     limitProb: 0.46,
// //     probAfter: 0.33962269592708333,
// //     contractId: 'A319ydGB1B7f4PMOROL3',
// //     loanAmount: 0,
// //     probBefore: 0.33962269592708333,
// //     visibility: 'public',
// //     createdTime: 1704984300668,
// //     isCancelled: false,
// //     isChallenge: false,
// //     orderAmount: 10000,
// //     isRedemption: false,
// //     userUsername: 'benshindel',
// //     userAvatarUrl: 'https://lh3.googleusercontent.com/a/ALm5wu22VD_r1GJh-n-cEmVyjrKEFlOdTcYxeXuYzn_4Ag=s96-c'
// //   }


// type ManifoldBet = {
//     id: string;
//     isFilled: boolean;
//     outcome: string;
//     limitProb: number;
//     contractId: string;
//     isCancelled: boolean;
//     };

// const isManifoldBet = (value: unknown): value is ManifoldBet => (
//     isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.isFilled === 'boolean'
//     && typeof value.outcome === 'string'
//     && typeof value.limitProb === 'number'
//     && typeof value.contractId === 'string'
//     && typeof value.isCancelled === 'boolean'
// );
    
// const isManifoldBetArray = (value: unknown): value is ManifoldBet[] => (
//     Array.isArray(value) && value.every(isManifoldBet)
// );


// const fetchFirstMatchingMarketOrder = async (marketId: string, prediction: ShareType): Promise<[number, number]> => {
//     const url = `https://api.manifold.markets/v0/bets?contractId=${marketId}&kinds=open-limit`;
//     const headers = {  
//         'Authorization': `Key ${config.apiKey}`,
//         'Content-Type': 'application/json'
//     };
//     const response = await fetch(url, { headers });
//     const json = await response.json();
//     if (!isManifoldBetArray(json)) {
//         throw new Error('Unexpected Manifold API response for "bets"');
//     }

//     if (prediction === ShareType.yes) {
//             let filteredAndSorted = json
//             .filter(obj => obj.outcome !== ShareType.no && !obj.isCancelled && !obj.isFilled) 
//             .sort((a, b) => b.limitProb - a.limitProb);
        
//         console.log('filteredAndSorted is: ', filteredAndSorted.slice(0, 5));
//         return [0, 0];
//     }
//     return [0, 0];
// }
// async function timeFunctionExecution(func: () => Promise<void>): Promise<number> {
//     const start = performance.now();
//     await func();
//     const end = performance.now();
//     return end - start;
// }

// const getMarketProb = async (marketId: string): Promise<number> => {
//     const url = `https://api.manifold.markets/v0/market/${marketId}`;  
//     const headers = {  
//         'Authorization': `Key ${config.apiKey}`,
//         'Content-Type': 'application/json'
//     };
//     const response = await fetch(url, { headers });
//     const json = await response.json();
//     if (!isMarketData(json)) {
//         throw new Error('Unexpected Manifold API response for "market"');
//     }  
//     return json.probability;
// }

// const sellShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<[string, number]> => {
//   const url = `https://api.manifold.markets/v0/market/${marketId}/sell`;
//   const headers = {
//     'Authorization': `Key ${config.apiKey}`,
//     'Content-Type': 'application/json'
//   };
//   const response = await fetch(url, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       outcome: prediction,
//       shares: shares_amount
//     })
//   });

//   const json: BetResponseJson = await response.json();

//   if (!isBetResponseJson(json)) {
//     console.log('json is: ', json);
//     throw new Error('Unexpected response type returned from Manifold API');
//   }

//   if (!json.isFilled) {
//     throw new Error('Failed to sell shares');
//   }
//   const sold_shares = Math.round(Number.parseFloat(json.shares));
//   console.log(`sold shares: ${sold_shares}`);
//   return [json.betId,  sold_shares];  
// }






// const buyNShares = async (marketId: string, prediction: ShareType, shares_amount: number): Promise<void> => {
//     let shares_bought = 0;
//     let mana_amount = 0;
//     let prob = 0.5;
//     while (shares_bought < shares_amount) {
//         prob = await getMarketProb(marketId);
//         mana_amount = Math.floor((shares_amount - shares_bought) * (prediction === ShareType.yes ? prob : 1 - prob));
//         mana_amount = Math.max(mana_amount, 10);
//         console.log(`prob = ${prob}, Buying for ${mana_amount} mana`);
//         const shares = (await buyShares(marketId, prediction, mana_amount))[1];
//         console.log(`Bought ${shares} shares, total bought: ${shares_bought}`);
//         shares_bought += shares;
//     }

//     console.log('Bought this many shares:', shares_bought);
//     console.log('selling extra shares');
//     const extra_shares = shares_bought - shares_amount;
//     const sold_shares = (await sellShares(marketId, prediction, extra_shares))[1];
//     shares_bought += sold_shares;
//     console.log(`total shares bought: ${shares_bought}`);
// }

async function timeFunctionExecution(func: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await func();
  const end = performance.now();
  return end - start;
}



const main = async () => {
    const marketId = await Manifold.getMarketID('will-vivek-ramaswamy-be-the-republi');
    const my_id = await Manifold.fetchMyId();
    let position = await Manifold.getMarketPosition(marketId, my_id);
    console.log('position is: ', position);
    // await Manifold.buyShares(marketId, Manifold.ShareType.yes, 100);
    // position = await Manifold.getMarketPosition(marketId, my_id);
    // console.log('position after is: ', position);
    await Manifold.buyShares(marketId, Manifold.ShareType.no, 40);
    position = await Manifold.getMarketPosition(marketId, my_id);
    console.log('position after is: ', position);

    // await Manifold.closePosition(marketId, Manifold.ShareType.no, 40);
    // const position1 = await Manifold.getMarketPosition(marketId, await manifold.fetchMyId());
    // console.log('position after is: ', position1);
    
}

timeFunctionExecution(main).then((executionTime) => {
    console.log('Execution time: ', executionTime);
}).catch(console.error);


