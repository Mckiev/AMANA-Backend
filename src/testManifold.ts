import Manifold, { ShareType } from "./manifold";

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
    const result = await Manifold.closePosition(marketId, ShareType.no, 500);
    console.log('result is: ', result);
    position = await Manifold.getMarketPosition(marketId, my_id);
    console.log('position is: ', position);
}

timeFunctionExecution(main).then((executionTime) => {
    console.log('Execution time: ', executionTime);
}).catch(console.error);


