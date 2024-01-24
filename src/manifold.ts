interface ManifoldTransfer {
    from: string;
    amount: string;
    memo: string;
  }
import * as dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.MANIFOLD_API_KEY;
// Receives account id as an argument, with default value set to my account id.
export async function  fetchManifoldTransactions(accountID: string = "6DLzPFOV0LelhuLPnCECIXqsIgN2" ): Promise<ManifoldTransfer[]> {
    // const transactions: manifoldTransfer[] = [
    //     { from: "Alice", amount: "100", memo: "Hello World from Alice" },
    //     { from: "Bob", amount: "50", memo: "Hello World from Bob" }
    //   ];
    
    // return transactions;

    function parseManifoldTransfers(transactions: any[]): ManifoldTransfer[] {
        return transactions.map(transaction => ({
          from: transaction.fromId, 
          amount: transaction.amount.toString(), 
          memo: transaction.data.message 
        }));
      }

    const url = `https://api.manifold.markets/v0/managrams?toId=${accountID}`;
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

}

