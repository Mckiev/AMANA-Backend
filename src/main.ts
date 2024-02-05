import { TXIDVersion } from '@railgun-community/engine'
import * as Railgun from './railgun/railgun'
import config from './config';

async function main() {
    const wallet = await Railgun.start();
  }  

main().catch(console.error);