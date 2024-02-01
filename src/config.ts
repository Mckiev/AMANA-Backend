import { Mnemonic, randomBytes } from 'ethers';
import * as dotenv from 'dotenv';
import constants from './constants';
dotenv.config();

// TODO will need to generate this safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;

const apiKey = process.env.MANIFOLD_BOT_API_KEY ?? '';
const mckievAPIKey = process.env.MANIFOLD_MCKIEV_API_KEY ?? '';

const feeToken = constants.TOKENS.WMATIC;
const apiPort = 80;

export default {
  mnemonic,
  encryptionKey,
  apiKey,
  mckievAPIKey,
  feeToken,
  apiPort,
};