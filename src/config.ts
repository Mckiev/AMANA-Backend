import { Mnemonic, randomBytes } from 'ethers';

// TODO will need to generate this safely in the future
const encryptionKey: string = '0101010101010101010101010101010101010101010101010101010101010101';

const mnemonic:string = process.env.TEST_MNEMONIC ?? Mnemonic.fromEntropy(randomBytes(16)).phrase;

const apiKey = process.env.MANIFOLD_BOT_API_KEY ?? '';
const mckievAPIKey = process.env.MANIFOLD_MCKIEV_API_KEY ?? '';

export default {
  mnemonic,
  encryptionKey,
  apiKey,
  mckievAPIKey
};