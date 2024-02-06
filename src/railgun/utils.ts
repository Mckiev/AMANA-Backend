import {formatUnits} from 'ethers';
import {TransactionHistoryEntry, AbstractWallet} from '@railgun-community/engine';
import { Chain } from '@railgun-community/shared-models';
import { validateRailgunAddress } from '@railgun-community/wallet';

export type TxInfo = {
    length: number;
    };

export const logTransactionDetails = (transactions: TransactionHistoryEntry[]): void => {
    console.log('Logging transaction details...');
    for (const tx of transactions) {
        try {
            console.log("Token Address:", tx.receiveTokenAmounts[0]?.tokenData.tokenAddress ?? '');
            console.log("Amount:", formatUnits(tx.receiveTokenAmounts[0]?.amount ?? 0n, 18));
            console.log("MEMO:", tx.receiveTokenAmounts[0]?.memoText ?? '');
        } catch (error) {
          console.log('got ERROR');
            console.error('Error encountered:', error);
        }
    }
}


export async function fetchTransactionHistory(wallet:AbstractWallet, chain: Chain, tx_info: TxInfo) {
    console.log('Fetching transaction history NON-RECURSIVE...');
    try {
        const currentTransactionHistory = await wallet.getTransactionHistory(chain, undefined);
        if (currentTransactionHistory.length > tx_info.length) {
            console.log('New transaction[s] detected!');
            const number_new = currentTransactionHistory.length - tx_info.length;
            console.log('Number of new transactions:', number_new);
            const newTransactions = Array.from(currentTransactionHistory).slice(0, number_new);
            logTransactionDetails(newTransactions);
            tx_info.length = currentTransactionHistory.length;
            return tx_info.length;
  
        }
    } catch (error) {
        console.error('Error encountered:', error);
    }
  }

export const extractZKaddress = (memo: string): string | undefined => {
    const pattern = /0zk[a-fA-F0-9]+/;
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