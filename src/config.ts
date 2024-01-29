import { Mnemonic, randomBytes } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

// TODO will need to generate this safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;

export default {
  mnemonic,
  encryptionKey,
};