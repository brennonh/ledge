import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountService } from './account.service';
import {
  Journal,
  JournalDocument,
  JournalStatus,
} from '../schemas/journal.schema';
import { Transaction } from '../entities/transaction.entity';

export interface AuthorizedAccountTransaction {
  journalId: string;
  description: string;
  amount: number;
  accountId: string;
  transactionType: 'debit' | 'credit';
}

@Injectable()
export class JournalService {
  constructor(
    @InjectModel(Journal.name) private journalModel: Model<JournalDocument>,
    private readonly accountService: AccountService,
  ) {}

  async createJournal(
    journalId: string,
    description: string,
    transactions: Transaction[] = [],
  ): Promise<Journal> {
    this.validateJournalTransactions(transactions);

    return this.journalModel.create({
      journalId,
      description,
      transactions,
      status: 'preauth',
    });
  }

  async getJournal(journalId: string): Promise<Journal | null> {
    return this.journalModel.findOne({ journalId }).lean();
  }

  async getAllJournals(): Promise<Journal[]> {
    return this.journalModel.find().lean();
  }

  private validateJournalTransactions(transactions: Transaction[]): void {
    const total = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    if (total !== 0) {
      throw new BadRequestException(
        'Journal transactions must balance to 0. Debits and credits must cancel out.',
      );
    }
  }

  async createTransactionAndPost(
    journalId: string,
    amount: number,
    debitAccountId: string,
    creditAccountId: string,
  ): Promise<void> {
    const journal = await this.journalModel.findOne({ journalId });
    if (!journal) {
      throw new BadRequestException('Journal not found');
    }

    if (journal.status !== 'preauth') {
      throw new BadRequestException(
        'Transactions can only be added to preauth journals',
      );
    }

    journal.transactions.push(
      new Transaction(amount, debitAccountId) as any,
      new Transaction(-amount, creditAccountId) as any,
    );
    this.validateJournalTransactions(journal.transactions as Transaction[]);
    await journal.save();
  }

  async authorizeJournal(journalId: string): Promise<void> {
    const journal = await this.journalModel.findOne({ journalId });
    if (!journal || journal.status !== 'preauth') {
      return;
    }

    const balanceUpdates: Record<string, number> = {};
    for (const transaction of journal.transactions) {
      balanceUpdates[transaction.accountId] =
        (balanceUpdates[transaction.accountId] ?? 0) + transaction.amount;
    }

    for (const [accountId, amount] of Object.entries(balanceUpdates)) {
      await this.accountService.updateBalance(accountId, amount);
    }

    journal.status = 'authorized';
    await journal.save();
  }

  async rejectJournal(journalId: string): Promise<void> {
    const journal = await this.journalModel.findOne({ journalId });
    if (!journal) {
      return;
    }

    journal.status = 'rejected';
    await journal.save();
  }

  async getJournalsByStatus(status: JournalStatus): Promise<Journal[]> {
    return this.journalModel.find({ status }).lean();
  }

  async getAuthorizedTransactionsForAccount(
    accountId: string,
  ): Promise<AuthorizedAccountTransaction[]> {
    const journals = await this.journalModel
      .find({ status: 'authorized', 'transactions.accountId': accountId })
      .lean();

    return journals.flatMap((journal) =>
      journal.transactions
        .filter((transaction) => transaction.accountId === accountId)
        .map((transaction) => ({
          journalId: journal.journalId,
          description: journal.description,
          amount: transaction.amount,
          accountId: transaction.accountId,
          transactionType: transaction.amount >= 0 ? 'debit' : 'credit',
        })),
    );
  }
}
