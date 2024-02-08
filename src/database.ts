// import fs from 'fs';
// import path from 'path';
import { randomBytes } from 'crypto';
import { Pool } from 'pg';


const generateId = (): string => (
  randomBytes(32).toString('hex')
);

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
  // TODO:
  // Bets:
  // + id
  // + timestamp
  // + railgunTransactionId
  // + amount
  // + marketUrl
  // + prediction
  // + redemptionAddress
  // + state = (placing, placed, redeeming, redeemed)
};

enum DepositState {
  Requested = 'Requested',
  Submitted = 'Submitted',
  Confirmed = 'Confirmed',
}

enum WithdrawalState {
  Requested = 'Requested',
  Confirmed = 'Confirmed',
}

// enum BetState {
//   Placing = 'Placing',
//   Placed = 'Placed',
//   Redeeming = 'Redeeming',
//   Redeemed = 'Redeemed',
// }

type StringObject = { [key: string]: string };

const isStringObject = (item: unknown): item is StringObject => (
  typeof item === 'object'
    && item !== null
    && Object.entries(item).every(([key, value]) => (
      typeof key === 'string'
        && typeof value === 'string'
    ))
);

const isArrayOfStringObjects = (values: unknown): values is StringObject[] => (
  Array.isArray(values)
    && values.every(isStringObject)
);

const isDepositState = (value: unknown): value is DepositState => (
  typeof value === 'string'
    && value in DepositState
);

const isWithdrawalState = (value: unknown): value is WithdrawalState => (
  typeof value === 'string'
    && value in WithdrawalState
);

type Deposit = {
  id: string;
  timestamp: bigint;
  railgunAddress: string;
  manifoldTransferId: string;
  manifoldUserId: string;
  amount: bigint;
  state: DepositState;
};

// const isDeposit = (value: unknown): value is Deposit => (
//   isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.timestamp === 'bigint'
//     && typeof value.railgunAddress === 'string'
//     && typeof value.manifoldTransferId === 'string'
//     && typeof value.manifoldUserId === 'string'
//     && typeof value.amount === 'bigint'
//     && typeof value.state === 'string'
//     && value.state in DepositState
// );

// const isDeposits = (values: unknown): values is Deposit[] => (
//   Array.isArray(values)
//     && values.every(value => isDeposit(value))
// );

type Withdrawal = {
  id: string;
  timestamp: bigint;
  railgunTransactionId: string;
  manifoldUserId: string;
  manifoldUsername: string;
  manifoldTransferId: string;
  amount: bigint;
  state: WithdrawalState;
};

// const isWithdrawal = (value: unknown): value is Withdrawal => (
//   isObjectRecord(value)
//     && typeof value.id === 'string'
//     && typeof value.timestamp === 'bigint'
//     && typeof value.railgunTransactionId === 'string'
//     && typeof value.manifoldUserId === 'string'
//     && typeof value.manifoldUsername === 'string'
//     && typeof value.manifoldTransferId === 'string'
//     && typeof value.amount === 'bigint'
//     && typeof value.state === 'string'
//     && value.state in WithdrawalState
// );

// const isWithdrawals = (values: unknown): values is Withdrawal[] => (
//   Array.isArray(values)
//     && values.every(value => isWithdrawal(value))
// );

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

const convertToWithdrawal = (value: StringObject): Withdrawal => {
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
    manifoldTransferId: value.manifoldtransferid,
    amount,
    state,
  };
}

const createWithdrawal = async (
  railgunTransactionId: string,
  timestamp: bigint,
  manifoldUserId: string,
  manifoldUsername: string,
  amount: bigint,
): Promise<string> => {
  const id = generateId();
  const manifoldTransferId = 'pending';
  const state = WithdrawalState.Requested;
  const query = 'INSERT INTO Withdrawals (id, timestamp, railgunTransactionid, manifoldUserId, manifoldUsername, manifoldTransferId, amount, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING';
  const parameters = [id, timestamp, railgunTransactionId, manifoldUserId, manifoldUsername, manifoldTransferId, amount, state];
  await connection.query(query, parameters);
  return id;
};

const getQueuedWithdrawal = async (): Promise<Withdrawal | undefined> => {
  const query = 'SELECT * FROM Withdrawals WHERE state=$1 ORDER BY timestamp ASC';
  const parameters = [WithdrawalState.Requested];
  const results = await connection.query(query, parameters);
  const {rows} = results;
  if (rows.length === 0) {
    return undefined;
  }
  if (!isArrayOfStringObjects(rows)) {
    console.log('rows:', rows);
    throw new Error('Expected the rows to be an array of string objects');
  }
  const withdrawals = rows.map(convertToWithdrawal);
  return withdrawals[0];
}

const updateWithdrawalToConfirmed = async (id: string): Promise<void> => {
  const state = WithdrawalState.Confirmed;
  const query = 'UPDATE Withdrawals SET state=$1 WHERE id=$2';
  const parameters = [state, id];
  await connection.query(query, parameters);
};

export default {
  initialize,
  createDepositIfNotExists,
  updateDepositToSubmitted,
  updateDepositToConfirmed,
  getQueuedDeposit,
  getQueuedWithdrawal,
  createWithdrawal,
  updateWithdrawalToConfirmed,
};
