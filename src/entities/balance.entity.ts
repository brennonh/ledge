export interface BalanceInfo {
  currentBalance: number;
  pendingBalance: number;
  availableBalance: number;
}

export class Balance {
  balanceId: string;
  accountId: string;
  currentBalance: number;

  constructor(balanceId: string, accountId: string, currentBalance: number) {
    this.balanceId = balanceId;
    this.accountId = accountId;
    this.currentBalance = currentBalance;
  }

  updateBalance(amount: number): void {
    this.currentBalance += amount;
  }

  getBalance(): number {
    return this.currentBalance;
  }

  getBalanceInfo(pendingAmount: number = 0): BalanceInfo {
    return {
      currentBalance: this.currentBalance,
      pendingBalance: pendingAmount,
      availableBalance: this.currentBalance - pendingAmount,
    };
  }
}
