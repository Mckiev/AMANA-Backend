import Manifold, { ShareType } from "./manifold";

async function timeFunctionExecution(func: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await func();
  const end = performance.now();
  return end - start;
}



const main = async () => {
    const marketId = await Manifold.getMarketID('will-claude-3-outrank-gpt4-on-the-l');
    const my_id = await Manifold.fetchMyId();
    console.log('my_id is: ', my_id);
    console.log('marketId is: ', marketId);

    // const result = await Manifold.buyShares(marketId, ShareType.yes, 20);
    // console.log('result is: ', result);
    const sell2 = await Manifold.closePosition(marketId, ShareType.yes, 100);
    console.log('sell2 is: ', sell2);

}

timeFunctionExecution(main).then((executionTime) => {
    console.log('Execution time: ', executionTime);
});


