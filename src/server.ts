import express from 'express';
import bodyParser from 'body-parser';
import config from './config';
import { tryDecryptJSONDataWithSharedKey } from '@railgun-community/wallet';
import { calculateRailgunTransactionVerificationHash } from '@railgun-community/engine';

const app = express();

app.use(bodyParser.json());

app.post('/submit-transaction', (req, res) => {
  const { transaction } = req.body;
  transaction.gasLimit = BigInt(transaction.gasLimit);
  transaction.maxFeePerGas = BigInt(transaction.maxFeePerGas);
  transaction.maxPriorityFeePerGas = BigInt(transaction.maxPriorityFeePerGas);
  console.log('transaction');
  console.log(transaction);

  // TODO: validate transaction
  // TODO: sign and broadcast transaction
  res.json({
    success: false, // TODO
  });
});

const initialize = () => new Promise(resolve => {
  app.listen(config.apiPort, () => {
    console.log(`API listening on port ${config.apiPort}`);
    resolve(undefined);
  });
});

export default {
  initialize,
};