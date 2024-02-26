// import fs from 'fs';
// import path from 'path';
import { Pool } from 'pg';
import generateId from './utils/generateId';
import {ShareType} from './manifold';
import {
  isArrayOfStringObjects,
  isDepositState,
  isWithdrawalState,
  isBetState,
  isWithdrawalRow,
  isBetRow,
  StringObject,
  WithdrawalState,
  DepositState,
  BetState,
  Deposit,
  Withdrawal,
  Bet,
  BetRow,
  WithdrawalRow,
} from './types';


// const PG_CERT_PATH = path.join(__dirname, '../ca-certificate.crt');
// const PG_CERT = fs.readFileSync(PG_CERT_PATH).toString();

const pool = new Pool({
  ssl: {
    rejectUnauthorized: false,
    // cert: PG_CERT,
  }
});

const connection = {
  query: (text: string, params: unknown[] = []) => pool.query(text, params),
};

const initialize = async () => {
  console.log('creating deposits table');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Deposits (
      id VARCHAR(64) PRIMARY KEY,
      timestamp BIGINT,
      railgunAddress VARCHAR(127),
      manifoldTransferId TEXT UNIQUE,
      manifoldUserId TEXT,
      amount BIGINT,
      state TEXT
    );
  `);
  console.log('creating withdrawals table');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Withdrawals (
      id VARCHAR(64) PRIMARY KEY,
      timestamp BIGINT,
      railgunTransactionId TEXT UNIQUE,
      manifoldUserId TEXT,
      manifoldUsername TEXT,
      manifoldTransferId TEXT,
      amount BIGINT,
      state TEXT
    );
  `);
  console.log('creating bets table');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Bets (
      id VARCHAR(64) PRIMARY KEY,
      timestamp BIGINT,
      railgunTransactionId TEXT UNIQUE,
      amount BIGINT,
      marketUrl TEXT,
      marketId TEXT,
      prediction TEXT,
      redemptionAddress TEXT,
      betId TEXT,
      nShares INTEGER,
      state TEXT
    );
  `);
};


// deposit related functions

const createDepositIfNotExists = async (
  railgunAddress: string,
  manifoldTransferId: string,
  manifoldUserId: string,
  amount: bigint,
): Promise<void> => {
  const id = generateId();
  const timestamp = Date.now();
  const state = DepositState.Requested;
  const query = 'INSERT INTO Deposits (id, timestamp, railgunAddress, manifoldTransferId, manifoldUserId, amount, state) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING';
  const parameters = [id, timestamp, railgunAddress, manifoldTransferId, manifoldUserId, amount, state];
  await connection.query(query, parameters);
};

const updateDepositToSubmitted = async (id: string): Promise<void> => {
  const state = DepositState.Submitted;
  const query = 'UPDATE Deposits SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

const updateDepositToConfirmed = async (id: string): Promise<void> => {
  const state = DepositState.Confirmed;
  const query = 'UPDATE Deposits SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

const updateDepositToFailed = async (id: string): Promise<void> => {
  const state = DepositState.Failed;
  const query = 'UPDATE Deposits SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

const convertToDeposit = (value: StringObject): Deposit => {
  const state = value.state;
  if (!isDepositState(state)) {
    throw new Error(`Invalid state value: ${value.state}`);
  }
  const timestamp = BigInt(value.timestamp);
  const amount = BigInt(value.amount);

  return {
    id: value.id,
    timestamp,
    railgunAddress: value.railgunaddress,
    manifoldTransferId: value.manifoldtransferid,
    manifoldUserId: value.manifolduserid,
    amount,
    state,
  };
};

const getQueuedDeposit = async (): Promise<Deposit | undefined> => {
  const query = 'SELECT * FROM Deposits WHERE state=$1 OR state=$2 ORDER BY timestamp ASC';
  const parameters = [DepositState.Requested, DepositState.Submitted];
  const results = await connection.query(query, parameters);
  const {rows} = results;
  if (!isArrayOfStringObjects(rows)) {
    throw new Error('Expected the rows to be an array of string objects');
  }
  const deposits = rows.map(convertToDeposit);
  const submitted = deposits.some(deposit => deposit.state === DepositState.Submitted)
  if (submitted) { 
    return undefined;
  }
  return deposits.find(deposit => deposit.state === DepositState.Requested);
};



// withdrawal related functions

const convertToWithdrawal = (value: WithdrawalRow): Withdrawal => {
  const state = value.state;
  if (!isWithdrawalState(state)) {
    throw new Error(`Invalid state value: ${value.state}`);
  }
  const timestamp = BigInt(value.timestamp);
  const amount = BigInt(value.amount);

  return {
    id: value.id,
    timestamp,
    railgunTransactionId: value.railguntransactionid,
    manifoldUserId: value.manifolduserid,
    manifoldUsername: value.manifoldusername,
    manifoldTransferId: (
      value.manifoldtransferid === null
      ? undefined
      : value.manifoldtransferid
    ),
    amount,
    state,
  };
};

const createWithdrawal = async (
  railgunTransactionId: string,
  timestamp: bigint,
  manifoldUserId: string,
  manifoldUsername: string,
  amount: bigint,
): Promise<void> => {
  const id = generateId();
  const state = WithdrawalState.Requested;
  const query = 'INSERT INTO Withdrawals (id, timestamp, railgunTransactionid, manifoldUserId, manifoldUsername, manifoldTransferId, amount, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING';
  const parameters = [id, timestamp, railgunTransactionId, manifoldUserId, manifoldUsername, null, amount, state];
  await connection.query(query, parameters);
};

const getQueuedWithdrawal = async (): Promise<Withdrawal | undefined> => {
  const query = 'SELECT * FROM Withdrawals WHERE state=$1 ORDER BY timestamp ASC LIMIT 1';
  const parameters = [WithdrawalState.Requested];
  const results = await connection.query(query, parameters);
  const row: unknown = results.rows[0];
  if (row === undefined) {
    return undefined;
  }
  if (!isWithdrawalRow(row)) {
    throw new Error('Expected the row to be a WithdrawalRow');
  }
  return convertToWithdrawal(row);
};

const updateWithdrawalToConfirmed = async (id: string, manifoldTransferId: string): Promise<void> => {
  const state = WithdrawalState.Confirmed;
  const query = 'UPDATE Withdrawals SET state=$1, manifoldTransferId=$2 WHERE id=$3';
  const parameters = [state, manifoldTransferId, id];
  await connection.query(query, parameters);
};

const updateWithdrawToFailedToFind = async (id: string): Promise<void> => {
  const state = WithdrawalState.FailedToFind;
  const query = 'UPDATE Withdrawals SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

const updateWithdrawToFailedToSend = async (id: string): Promise<void> => {
  const state = WithdrawalState.FailedToSend;
  const query = 'UPDATE Withdrawals SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

// bet related functions

const convertToBet = (value: BetRow): Bet => {
  const state = value.state;
  if (!isBetState(state)) {
    throw new Error(`Invalid state value: ${value.state}`);
  }
  const timestamp = BigInt(value.timestamp);
  const amount = BigInt(value.amount);
  let prediction: ShareType;
  if (value.prediction.toUpperCase() == 'YES') {
    prediction = ShareType.yes;
  } else if (value.prediction.toUpperCase() == 'NO') {
    prediction = ShareType.no;
  } else {
    throw new Error(`Invalid prediction value: ${value.prediction}`);
  }

  return {
    id: value.id,
    timestamp,
    railgunTransactionId: value.railguntransactionid,
    amount,
    marketUrl: value.marketurl,
    marketId: value.marketid,
    prediction,
    redemptionAddress: value.redemptionaddress,
    betId: (
      value.betid === null
      ? undefined
      : value.betid
    ),
    nShares: (
      value.nshares === null
      ? undefined
      : parseInt(value.nshares)
    ),
    state,
  };
};

const createBet = async (
  railgunTransactionId: string,
  timestamp: bigint,
  amount: bigint,
  marketUrl: string,
  marketId: string,
  prediction: string,
  redemptionAddress: string,
): Promise<void> => {
  const id = generateId();
  const state = BetState.Placing;
  const query = 'INSERT INTO Bets (id, timestamp, railgunTransactionid, amount, marketUrl, marketId, prediction, redemptionAddress, nShares, betId, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING';
  const parameters = [id, timestamp, railgunTransactionId, amount, marketUrl, marketId, prediction, redemptionAddress, null, null, state];
  await connection.query(query, parameters);
}

const getQueuedBet = async (): Promise<Bet | undefined> => {
  const query = 'SELECT * FROM Bets WHERE state=$1 ORDER BY timestamp ASC LIMIT 1';
  const parameters = [BetState.Placing];
  const results = await connection.query(query, parameters);
  const row: unknown = results.rows[0];
  if (row === undefined) {
    return undefined;
  }
  if (!isBetRow(row)) {
    throw new Error('Expected the row to be a BetRow');
  }
  return convertToBet(row);
}

const updateBetToPlaced = async (id: string, betId: string, nShares: number): Promise<void> => {
  const state = BetState.Placed;
  const query = 'UPDATE Bets SET state=$1, betId=$2, nShares=$3 WHERE id=$4';
  const parameters = [state, betId, nShares, id];
  await connection.query(query, parameters);
};

const updateBetToFailed = async (id: string): Promise<void> => {
  const state = BetState.Failed;
  const query = 'UPDATE Bets SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

export default {
  initialize,
  createDepositIfNotExists,
  updateDepositToSubmitted,
  updateDepositToConfirmed,
  updateDepositToFailed,
  getQueuedDeposit,
  getQueuedWithdrawal,
  createWithdrawal,
  updateWithdrawalToConfirmed,
  updateWithdrawToFailedToFind,
  updateWithdrawToFailedToSend,
  createBet,
  getQueuedBet,
  updateBetToPlaced,
  updateBetToFailed,
};
