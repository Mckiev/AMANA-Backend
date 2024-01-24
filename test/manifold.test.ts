import { fetchManifoldTransactions } from '../src/manifold';


// This test whether the function fetchManifoldTransactions() returns a non empty transaction list from Manifold.
describe('fetchManifoldTransactions function', () => {
    it('should fetch transactions successfully with the correct structure', async () => {
        const result = await fetchManifoldTransactions();
        console.log(result);
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


