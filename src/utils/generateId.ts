import { randomBytes } from 'crypto';

export default (): string => (
  randomBytes(32).toString('hex')
);