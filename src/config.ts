import * as dotenv from 'dotenv';
import constants from './constants';
dotenv.config();

// TODO will need to generate this safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic = process.env.MNEMONIC;

if (mnemonic === undefined) {
  throw new Error('An environment variable for the TEST_MNEMONIC was not provided.');
}

const userMnemonic = process.env.TEST_USER_MNEMONIC;

if (userMnemonic === undefined) {
  throw new Error('An environment variable for the TEST_USER_MNEMONIC was not provided.');
}

const apiKey = process.env.MANIFOLD_BOT_API_KEY ?? '';
const mckievAPIKey = process.env.MANIFOLD_MCKIEV_API_KEY ?? '';
const polygonApiKey = process.env.POLYGON_INFURA_API ?? '';
const rpc1_api = process.env.RPC1_API ?? '';


export default {
  mnemonic,
  userMnemonic,
  encryptionKey,
  apiKey,
  mckievAPIKey,
  polygonApiKey,
  rpc1_api,
};