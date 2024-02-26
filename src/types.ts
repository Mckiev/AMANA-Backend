import { ShareType } from "./manifold";


type ObjectRecord = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is ObjectRecord => (
  typeof value === 'object'
    && !Array.isArray(value)
    && value !== null
);

enum DepositState {
  Requested = 'Requested',
  Submitted = 'Submitted',
  Confirmed = 'Confirmed',
  Failed = 'Failed',
}

enum WithdrawalState {
  Requested = 'Requested',
  FailedToSend = 'FailedToSend',
  FailedToFind = 'FailedToFind',
  Confirmed = 'Confirmed',
}

enum BetState {
  Placing = 'Placing',
  Placed = 'Placed',
  Redeeming = 'Redeeming',
  Redeemed = 'Redeemed',
  Failed = 'Failed',
}

type Deposit = {
  id: string;
  timestamp: bigint;
  railgunAddress: string;
  manifoldTransferId: string;
  manifoldUserId: string;
  amount: bigint;
  state: DepositState;
};


type Withdrawal = {
  id: string;
  timestamp: bigint;
  railgunTransactionId: string;
  manifoldUserId: string;
  manifoldUsername: string;
  manifoldTransferId?: string;
  amount: bigint;
  state: WithdrawalState;
};

type Bet = {
  id: string;
  timestamp: bigint;
  railgunTransactionId: string;
  amount: bigint;
  marketUrl: string;
  marketId: string;
  prediction: ShareType;
  redemptionAddress: string;
  betId: string | undefined;
  nShares: number | undefined;
  state: BetState;
};

type WithdrawalRow = {
  id: 'string',
  timestamp: 'string',
  railguntransactionid: 'string',
  manifolduserid: 'string',
  manifoldusername: 'string',
  manifoldtransferid: 'string' | null,
  amount: 'string',
  state: 'string'
};

const isWithdrawalRow = (value: unknown) : value is WithdrawalRow => (
  isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.timestamp === 'string'
    && typeof value.railguntransactionid === 'string'
    && typeof value.manifolduserid === 'string'
    && typeof value.manifoldusername === 'string'
    && (
      value.manifoldtransferid === null
      || typeof value.manifoldtransferid === 'string'
    )
    && typeof value.amount === 'string'
    && typeof value.state === 'string'
);

type BetRow = {
  id: 'string',
  timestamp: 'string',
  railguntransactionid: 'string',
  amount: 'string',
  marketurl: 'string',
  marketid: 'string',
  prediction: 'string',
  redemptionaddress: 'string',
  betid: 'string' | null,
  nshares: 'string' | null,
  state: 'string'
};

const isBetRow = (value: unknown) : value is BetRow => (
  isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.timestamp === 'string'
    && typeof value.railguntransactionid === 'string'
    && typeof value.amount === 'string'
    && typeof value.marketurl === 'string'
    && typeof value.marketid === 'string'
    && typeof value.prediction === 'string'
    && typeof value.redemptionaddress === 'string'
    &&  (
      value.betid === null
      || typeof value.betid === 'string'
    )
    &&  (
      value.nshares === null
      || typeof value.nshares === 'string'
    )
    && typeof value.state === 'string'
);

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

const isBetState = (value: unknown): value is BetState => (
  typeof value === 'string'
    && value in BetState
);

export {
  isObjectRecord,
  isStringObject,
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
};