import { Transaction } from './transaction.entity';

export type JournalStatus = 'preauth' | 'authorized' | 'rejected';

export class Journal {
  journalId: string;
  description: string;
  transactions: Transaction[];
  status: JournalStatus;

  constructor(
    journalId: string,
    description: string,
    transactions: Transaction[] = [],
    status: JournalStatus = 'preauth',
  ) {
    this.journalId = journalId;
    this.description = description;
    this.transactions = transactions;
    this.status = status;
  }

  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  setStatus(status: JournalStatus): void {
    this.status = status;
  }

  getStatus(): JournalStatus {
    return this.status;
  }
}
