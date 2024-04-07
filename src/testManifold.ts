import Manifold from "./manifold";

async function timeFunctionExecution(func: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await func();
  const end = performance.now();
  return end - start;
}



const main = async () => {
    const marketId = await Manifold.getMarketID('will-my-pussy-in-bio-spam-stop-by-a');
    const my_id = await Manifold.fetchMyId();
    const username = await Manifold.getUsername(my_id);
    console.log('my_id is: ', my_id);
    console.log('marketId is: ', marketId);
    console.log('username is: ', username);
    // const mckiev_id = await Manifold.getUserID('mckiev');
    const market_prob = await Manifold.getMarketProb(marketId);
    console.log('position is: ', market_prob);

    // const result = await Manifold.buyShares(marketId, ShareType.yes, 20);
    // console.log('result is: ', result);
    // const sell2 = await Manifold.closePosition(marketId, ShareType.yes, 100);
    // console.log('sell2 is: ', sell2);

}

timeFunctionExecution(main).then((executionTime) => {
    console.log('Execution time: ', executionTime);
});


