import * as Railgun from './railgun/railgun';

const main = async() => {
  await Railgun.start();
};

main().catch(console.error);