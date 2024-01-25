type ObjectRecord = Record<string, unknown>;

export const isObjectRecord = (value: unknown): value is ObjectRecord => (
  typeof value === 'object'
    && !Array.isArray(value)
    && value !== null
);

export type ManifoldTransfer = {
  from: string;
  amount: string;
  memo: string;
};

type ManifoldTransactionJSON = {
  fromId: string;
  amount: number;
  data: {
    message: string;
  };
};

export const isManifoldTransaction = (value: unknown): value is ManifoldTransactionJSON => (
  isObjectRecord(value)
    && typeof value.fromId === 'string'
    && typeof value.amount === 'number'
    && isObjectRecord(value.data)
    && typeof value.data.message === 'string'
);

type UserData = {
  id: string;
};

export const isUserData = (value: unknown): value is UserData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
);

type MarketData = {
  id: string;
}

export const isMarketData = (value: unknown): value is MarketData => (
  isObjectRecord(value)
    && typeof value.id === 'string'
);

export type ResponseJson = {
  success: boolean;
};

export type BetResponseJson = {
  isFilled: boolean;
};

export const isResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.success === 'boolean'
);

export const isBetResponseJson = (value: unknown): value is ResponseJson => (
  isObjectRecord(value)
    && typeof value.isFilled === 'boolean'
);

// defines enum for 'yes' and 'no' values
export enum ShareType {
  yes = 'YES',
  no = 'NO',
};