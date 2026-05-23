import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Account,
  AccountDocument,
  AccountType,
} from '../schemas/account.schema';
import { Balance, BalanceDocument } from '../schemas/balance.schema';
import { Journal, JournalDocument } from '../schemas/journal.schema';
import { Transaction } from '../entities/transaction.entity';
import { BalanceInfo } from '../entities/balance.entity';

export type AccountWithBalance = Account & BalanceInfo;

/**
 * Service responsible for account creation and balance retrieval.
 */
@Injectable()
export class AccountService {
  /**
   * Create an instance of AccountService.
   */
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Balance.name) private balanceModel: Model<BalanceDocument>,
    @InjectModel(Journal.name) private journalModel: Model<JournalDocument>,
  ) {}

  /**
   * Create a new account and linked balance document.
   *
   * @param accountId Unique account identifier
   * @param name Account display name
   * @param type Account type
   * @param openingBalance Initial balance for the account
   * @returns Created account with balance details
   */
  async createAccount(
    accountId: string,
    name: string,
    type: AccountType,
    openingBalance: number = 0,
  ): Promise<AccountWithBalance> {
    const account = await this.accountModel.create({ accountId, name, type });

    try {
      await this.balanceModel.create({
        balanceId: `BAL_${accountId}`,
        accountId,
        currentBalance: openingBalance,
      });
    } catch (error) {
      await this.accountModel.deleteOne({ accountId });
      throw error;
    }

    return this.buildAccountWithBalance(
      account.toObject ? account.toObject() : (account as Account),
    );
  }

  /**
   * Retrieve a single account with balance summary.
   *
   * @param accountId Account identifier
   * @returns Account and balance info or null if not found
   */
  async getAccount(accountId: string): Promise<AccountWithBalance | null> {
    const account = await this.accountModel.findOne({ accountId }).lean();
    if (!account) {
      return null;
    }

    return this.buildAccountWithBalance(account);
  }

  /**
   * Retrieve all accounts including balance summaries.
   *
   * @returns List of accounts with balance info
   */
  async getAllAccounts(): Promise<AccountWithBalance[]> {
    const accounts = await this.accountModel.find().lean();
    return Promise.all(
      accounts.map((account) => this.buildAccountWithBalance(account)),
    );
  }

  /**
   * Attach balance summary data to an account object.
   *
   * @param account Account document
   * @returns Account with balance details
   */
  private async buildAccountWithBalance(
    account: Account,
  ): Promise<AccountWithBalance> {
    const balanceInfo = (await this.getBalanceInfo(account.accountId)) ?? {
      currentBalance: 0,
      pendingBalance: 0,
      availableBalance: 0,
    };

    return {
      ...account,
      ...balanceInfo,
    };
  }

  /**
   * Retrieve the raw balance document for an account.
   *
   * @param accountId Account identifier
   * @returns Balance document or null if missing
   */
  async getBalance(accountId: string): Promise<Balance | null> {
    return this.balanceModel.findOne({ accountId }).lean();
  }

  /**
   * Retrieve current, pending, and available balances for an account.
   *
   * @param accountId Account identifier
   * @returns Balance summary or undefined if no balance exists
   */
  async getBalanceInfo(accountId: string): Promise<BalanceInfo | undefined> {
    const balance = await this.balanceModel.findOne({ accountId }).lean();
    if (!balance) {
      return undefined;
    }

    const pendingBalance = await this.calculatePendingBalance(accountId);
    return {
      currentBalance: balance.currentBalance,
      pendingBalance,
      availableBalance: balance.currentBalance - pendingBalance,
    };
  }

  /**
   * Calculate pending balance for an account from preauthorized journals.
   *
   * @param accountId Account identifier
   * @returns Absolute pending amount
   */
  private async calculatePendingBalance(accountId: string): Promise<number> {
    const journals = await this.journalModel
      .find({ status: 'preauth', 'transactions.accountId': accountId })
      .lean();

    let pendingAmount = 0;
    for (const journal of journals) {
      for (const transaction of journal.transactions) {
        if (transaction.accountId === accountId) {
          pendingAmount += transaction.amount;
        }
      }
    }

    return Math.abs(pendingAmount);
  }

  /**
   * Increase or decrease an account balance by a given amount.
   *
   * @param accountId Account identifier
   * @param amount Amount to update the balance by
   */
  async updateBalance(accountId: string, amount: number): Promise<void> {
    await this.balanceModel.findOneAndUpdate(
      { accountId },
      { $inc: { currentBalance: amount } },
      { new: true },
    );
  }

  /**
   * Retrieve all balance documents.
   *
   * @returns List of balances
   */
  async getAllBalances(): Promise<Balance[]> {
    return this.balanceModel.find().lean();
  }

  /**
   * Retrieve balance summaries for all accounts.
   *
   * @returns Map of account IDs to balance summaries
   */
  async getAllBalancesInfo(): Promise<Record<string, BalanceInfo>> {
    const balances = await this.getAllBalances();
    const result: Record<string, BalanceInfo> = {};
    for (const balance of balances) {
      const info = await this.getBalanceInfo(balance.accountId);
      if (info) {
        result[balance.accountId] = info;
      }
    }
    return result;
  }
}
