import {formatUnits} from 'ethers';
import {TransactionHistoryEntry, AbstractWallet} from '@railgun-community/engine';
import { Chain } from '@railgun-community/shared-models';
import { validateRailgunAddress, setOnBalanceUpdateCallback } from '@railgun-community/wallet';
import constants from '../constants';
import {chain, getWallet} from './railgun';
import Manifold, { ManifoldTransactionCallback } from "../manifold";
import database from '../database';
import * as Railgun from './railgun';
import { InfuraProvider } from 'ethers';

const provider = new InfuraProvider(137);

type RailgunTransactionCallback = (tx: RailgunTransaction) => void;

export type TxHistoryInfo = {
    length: number;
    };

export const logTransactionDetails = (transactions: TransactionHistoryEntry[]): void => {
    // console.log('Logging transaction details...');
    // TODO make this properly display outgoing transactions as well

    // OUTGOING transaction example:
    // {
    //     txidVersion: 'V2_PoseidonMerkle',
    //     txid: '21eea01dc4e74d335238c165187f78385c768ed3b21a0c12f51da632e5cb072f',
    //     timestamp: 1707282737.668,
    //     blockNumber: 53219919,
    //     transferTokenAmounts: [
    //       {
    //         tokenHash: '000000000000000000000000b7fa2208b49a65f9b9a85956fad7a3f361b248dd',
    //         tokenData: [Object],
    //         amount: 101n,
    //         outputType: 0,
    //         walletSource: 'quickstart demo',
    //         memoText: 'DEPOSIT FROM mckiev',
    //         hasValidPOIForActiveLists: false,
    //         recipientAddress: '0zk1qyql93qvzye2893gta6y5ha7vq5g25ctnkvnf9mlwjk34pett5utfrv7j6fe3z53lu72huwn80vy3pqt9zrpcuxncuc2tr9p3mv2jtqxkp4hawccfp832zhs6cz'
    //       }
    //     ],
    //     relayerFeeTokenAmount: undefined,
    //     changeTokenAmounts: [
    //       {
    //         tokenHash: '000000000000000000000000b7fa2208b49a65f9b9a85956fad7a3f361b248dd',
    //         tokenData: [Object],
    //         amount: 847499999999999999631n,
    //         outputType: 2,
    //         walletSource: 'quickstart demo',
    //         memoText: undefined,
    //         hasValidPOIForActiveLists: false
    //       }
    //     ],
    //     unshieldTokenAmounts: [],
    //     version: 3,
    //     receiveTokenAmounts: []
    //   }
    // INCOMING transaction example:
    // {
    //     txidVersion: 'V2_PoseidonMerkle',
    //     txid: '51fe3b35be158abda10049afedf1bf108b4e4dbd2d328115a33b8837a96c609c',
    //     timestamp: 1707195638.483,
    //     blockNumber: 53179719,
    //     transferTokenAmounts: [
    //       {
    //         tokenHash: '000000000000000000000000b7fa2208b49a65f9b9a85956fad7a3f361b248dd',
    //         tokenData: [Object],
    //         amount: 10000000000000000000n,
    //         outputType: 0,
    //         walletSource: 'quickstart demo',
    //         memoText: 'deposit',
    //         hasValidPOIForActiveLists: false,
    //         recipientAddress: '0zk1qy4sjmg5ecz9575f44yr32adshpz2jf4ylgcs20net0j060zmnsx0rv7j6fe3z53llxnety68h4jjhgjc7qpklk598t4lh7rcp95yp70tlmmpnagl6n2cyedj07'
    //       }
    //     ],
    //     relayerFeeTokenAmount: undefined,
    //     changeTokenAmounts: [
    //       {
    //         tokenHash: '000000000000000000000000b7fa2208b49a65f9b9a85956fad7a3f361b248dd',
    //         tokenData: [Object],
    //         amount: 990499999999999999964n,
    //         outputType: 2,
    //         walletSource: 'quickstart demo',
    //         memoText: undefined,
    //         hasValidPOIForActiveLists: false
    //       }
    //     ],
    //     unshieldTokenAmounts: [],
    //     version: 3,
    //     receiveTokenAmounts: [
    //       {
    //         tokenHash: '000000000000000000000000b7fa2208b49a65f9b9a85956fad7a3f361b248dd',
    //         tokenData: [Object],
    //         amount: 10000000000000000000n,
    //         memoText: 'deposit',
    //         senderAddress: undefined,
    //         shieldFee: undefined,
    //         balanceBucket: 'Spent',
    //         hasValidPOIForActiveLists: false
    //       }
    //     ]
    //   }

    for (const tx of transactions) {  
        try {
            console.log("Token Address:", tx.receiveTokenAmounts[0]?.tokenData.tokenAddress ?? '');
            console.log("Amount:", formatUnits(tx.receiveTokenAmounts[0]?.amount ?? 0n, 0));
            console.log("MEMO:", tx.receiveTokenAmounts[0]?.memoText ?? '');
        } catch (error) {
          console.log('got ERROR');
            console.error('Error encountered:', error);
        }
    }
}


export async function fetchTransactionHistory(wallet:AbstractWallet, chain: Chain, tx_info: TxHistoryInfo) {
    console.log('Fetching transaction history');
    try {
        const currentTransactionHistory = await wallet.getTransactionHistory(chain, undefined);
        if (currentTransactionHistory.length > tx_info.length) {
            console.log('New transaction[s] detected!');
            const number_new = currentTransactionHistory.length - tx_info.length;
            console.log('Number of new transactions:', number_new);
            const newTransactions = Array.from(currentTransactionHistory).slice(-number_new);
            logTransactionDetails(newTransactions);
            tx_info.length = currentTransactionHistory.length;
            return tx_info.length;
  
        }
    } catch (error) {
        console.error('Error encountered:', error);
    }
  }

const convertTransaction = async (tx: TransactionHistoryEntry): Promise<RailgunTransaction | undefined> => {
    if (tx.receiveTokenAmounts.length === 0) {
        return undefined;
    }
    const tokenAddress = tx.receiveTokenAmounts[0]?.tokenData.tokenAddress ?? '';
    const amanaAmounts = tx.receiveTokenAmounts.filter(amount => (
        amount.tokenData.tokenAddress === constants.TOKENS.AMANA
    ));
    const memo = typeof amanaAmounts[0]?.memoText === 'string'
        ? amanaAmounts[0]?.memoText
        : '';
    const amount = amanaAmounts.reduce(
        (sum, amanaAmount) => (
            sum + amanaAmount.amount
        ),
        0n,
    );
    const recipientAddress = getWallet().getAddress();
    if (!tx.timestamp) {
        tx.timestamp = (await provider.getBlock(tx.blockNumber))?.timestamp;
    }
    const timestamp = BigInt(Math.floor(tx.timestamp * 1000));
    return {
        txid: tx.txid,
        amount,
        memo,
        tokenAddress,
        recipientAddress,
        timestamp
    };
    

}

const isRailgunTransaction = (value: RailgunTransaction | undefined): value is RailgunTransaction => {
    return value !== undefined;
};

export async function fetchNewTransactions(): Promise<RailgunTransaction[]>{
    console.log('Fetching new transactions');
    const wallet = getWallet();
    try {
        const currentTransactionHistory = await wallet.getTransactionHistory(chain, undefined);
        const convertedTransactions = await Promise.all(currentTransactionHistory.map(convertTransaction));
        return convertedTransactions.filter(isRailgunTransaction);
    } catch (error) {
        console.error('Error encountered:', error);
        throw error;
    }
}

export const extractZKaddress = (memo: string): string | undefined => {
    const pattern = /0zk[a-zA-Z0-9]+/;
    const match = memo.match(pattern);
    if (match === null) {
        return undefined;
    }
    if (match[0].length < 127) {
        return undefined;
    }
    const zkAddress = match[0].substring(0, 127);
    const isValid = validateRailgunAddress(zkAddress);
    if (!isValid) {
        return undefined;
    }
    return zkAddress;
};

export type RailgunTransaction = {
    txid: string;
    amount: bigint;
    memo: string;
    tokenAddress: string;
    recipientAddress: string;
    timestamp: bigint;
}

export const onTransaction = (callback: RailgunTransactionCallback): void => {
    const handledTxIds: Record<string, true | undefined> = {};
    setOnBalanceUpdateCallback(async () => {
        console.log('Checking for Railgun transactions...');
        const allTransactions = await fetchNewTransactions();
        allTransactions.forEach(transaction => {
            const alreadyHandled = handledTxIds[transaction.txid] === true;
            if (!alreadyHandled) {
                handledTxIds[transaction.txid] = true;
                callback(transaction);
            }
        });
    });
  };

export function isTransactionWithdrawal(tx: RailgunTransaction): boolean {
    return tx.memo.toLowerCase().includes('withdraw:')
        && tx.recipientAddress.toLowerCase() === getWallet().getAddress().toLowerCase()
        && tx.tokenAddress.toLocaleLowerCase() === constants.TOKENS.AMANA.toLowerCase()
        && tx.amount > 0n;
}

export function isTransactionBet(tx: RailgunTransaction): boolean {
    return tx.memo.toLowerCase().startsWith('bet::')
        && tx.recipientAddress.toLowerCase() === getWallet().getAddress().toLowerCase()
        && tx.tokenAddress.toLocaleLowerCase() === constants.TOKENS.AMANA.toLowerCase()
        && tx.amount > 0n;
}

export function extractUsernameWithTrim(input: string): string {
    // Assumes we are receiving a memo in format "withdraw:<manifoldUsername>"
    const parts = input.split('withdraw:');
    return parts.length > 1 ? parts[1].trim() : '';
  }

export function extractBet(input: string): string[] {
    // Assumes we are receiving a memo in format "bet::<manifoldMarketSlug>::<prediction>::<redemptionAddress>"
    const [ marketUrl, prediction, redemptionAddress ] = input.split('::').slice(1).map(part => part.trim());
    if (!['YES', 'NO'].includes(prediction)) {
        throw new Error('Invalid prediction');
    }
    console.log('Extracted bet:', marketUrl, prediction, redemptionAddress);
    return [marketUrl, prediction, redemptionAddress];
}


export const handleManifoldTransfer: ManifoldTransactionCallback = async (transfer) => {
    console.log('handling a transfer', transfer);
    const zkAddress = Railgun.extractZKaddress(transfer.memo);
    if (zkAddress) {
      await database.createDeposit(zkAddress, transfer.id, transfer.from, transfer.amount);
    }
  };
  
export const handleRailgunTransaction = async (transaction : RailgunTransaction) => {
    // console.log('handling RAILGUN transaction', transaction);
    try {
      if (isTransactionWithdrawal(transaction)) {
        // console.log('handling withdrawal');
        await handleWithdrawal(transaction);
      }
      if (isTransactionBet(transaction)) {
        // console.log('handling bet');
        await handleBet(transaction);
      }
    } catch (e) {
      console.error('Failed to handle transaction', transaction.txid);
      await database.addFailedTransaction(transaction);
    }
  
    // TODO handle bets and closes
  }
  
  const handleBet = async (transaction : RailgunTransaction) => {
    const [marketURL, prediction, redemptionAddress] = extractBet(transaction.memo);
    const manifoldMarketId = await Manifold.getMarketID(marketURL);
    await database.createBet(transaction.txid, transaction.timestamp, transaction.amount,  marketURL, manifoldMarketId, prediction, redemptionAddress);
  }
    
  
  const handleWithdrawal = async (transaction : RailgunTransaction) => {
    const manifoldUsername = extractUsernameWithTrim(transaction.memo);
    const manifoldUsedId = await Manifold.getUserID(manifoldUsername);
    //TODO: handle if username not found
    await database.createWithdrawal(transaction.txid, transaction.timestamp, manifoldUsedId, manifoldUsername, transaction.amount);
  }