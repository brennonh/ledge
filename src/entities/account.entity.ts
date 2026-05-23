export type AccountType = 'asset' | 'liability';

export class Account {
  accountId: string;
  name: string;
  type: AccountType;

  constructor(accountId: string, name: string, type: AccountType) {
    this.accountId = accountId;
    this.name = name;
    this.type = type;
  }
}
