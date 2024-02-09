import { Mnemonic, randomBytes } from 'ethers';
import * as dotenv from 'dotenv';
import constants from './constants';
dotenv.config();

// TODO will need to generate this safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic = process.env.TEST_MNEMONIC;

if (mnemonic === undefined) {
  throw new Error('An environment variable for the TEST_MNEMONIC was not provided.');
}

const userMnemonic = process.env.TEST_USER_MNEMONIC;

if (userMnemonic === undefined) {
  throw new Error('An environment variable for the TEST_USER_MNEMONIC was not provided.');
}

const apiKey = process.env.MANIFOLD_BOT_API_KEY ?? '';
const mckievAPIKey = process.env.MANIFOLD_MCKIEV_API_KEY ?? '';

const feeToken = constants.TOKENS.WMATIC;

export default {
  mnemonic,
  userMnemonic,
  encryptionKey,
  apiKey,
  mckievAPIKey,
  feeToken,
};