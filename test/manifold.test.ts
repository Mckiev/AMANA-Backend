import { fetchManifoldTransactions, sendTransferToUsername, fetchUserID, fetchMarketID, tradeShares } from '../src/manifold';
import { ShareType } from '../src/types';
// This test whether the function fetchManifoldTransactions() returns a non empty transaction list from Manifold.
describe('fetchManifoldTransactions function', () => {
    it('should fetch transactions successfully with the correct structure', async () => {
        const result = await fetchManifoldTransactions();
        //receving some array of 2 or more transactions
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);

        //first element of the array has all the properties
        expect(result[0]).toHaveProperty('from');
        expect(result[0]).toHaveProperty('amount');
        expect(result[0]).toHaveProperty('memo');

        //the properties are of the correct type
        expect(typeof result[0].from).toBe('string');
        expect(typeof result[0].amount).toBe('string');
        expect(typeof result[0].memo).toBe('string');



        });
    });


// testing fetchUserID function

describe('fetchUserID function', () => {
    it('should fetch userID successfully', async () => {
        const result = await fetchUserID("testbot");
        expect(result).toEqual("6DLzPFOV0LelhuLPnCECIXqsIgN2")
    });
});



describe('sendTransferToUsername function', () => {
    it('should send transfer successfully', async () => {
        await sendTransferToUsername("testbot", 10, "test memo");
    });

    it('should send a transaction and verify it in the transaction list', async () => {
        const recipientUsername = 'testbot'; 
        const amount = 10; 
        // creating a random memo
        const memo = Math.random().toString(36).substring(7);
    
        // Send a transaction
        await sendTransferToUsername(recipientUsername, amount, memo);
    
        const recipientUserId = await fetchUserID(recipientUsername);
        // Fetch transactions for the recipient
        const transactions = await fetchManifoldTransactions(recipientUserId);
    
        // Find the transaction in the list
        const found = transactions.some(t => t.memo === memo && t.amount === amount.toString());
    
        // Assert that the transaction is found
        expect(found).toBe(true);
      }, 30000); // Increase timeout for integration tests

});



describe('tradeShares function', () => {
    it('should buy shares successfully', async () => {
        const marketID = "0kEFCvweNbvhKivYTJce";
        const yes_or_no = ShareType.no;
        const mana_amount = 10;
        await tradeShares(marketID, yes_or_no, mana_amount);
    });
});


describe('fetchMarketID function', () => {
    it('should fetch marketID from Slug successfully', async () => {
        const marketSlug = "test-question-4c1ff3f827cb";
        const result = await fetchMarketID(marketSlug);
        expect(result).toEqual("0kEFCvweNbvhKivYTJce");
    });
});