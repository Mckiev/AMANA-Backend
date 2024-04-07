import * as dotenv from 'dotenv';
dotenv.config();

export default {
  TOKENS: {
    AMANA: process.env.AMANA_TOKEN_ADDRESS ?? '0x9064ed5d54e3e0558c523ba163044e1d8c93ce30',
  },
  CHAINS: {
    POLYGON: 137,
  },
  MANIFOLD: {
    BOT_ID: process.env.MANIFOLD_BOT_ID,
    maxWithdrawal: 10000n,
    maxBet: 10000n,
  }
}