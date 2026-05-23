import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument } from '../schemas/account.schema';
import { Journal, JournalDocument } from '../schemas/journal.schema';
import { Balance, BalanceDocument } from '../schemas/balance.schema';
import { BalanceInfo } from '../entities/balance.entity';

/**
 * Service for ledger-level summary operations.
 */
@Injectable()
export class LedgerService {
  /**
   * Create an instance of LedgerService.
   */
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Journal.name) private journalModel: Model<JournalDocument>,
    @InjectModel(Balance.name) private balanceModel: Model<BalanceDocument>,
  ) {}

  /**
   * Get a summary of accounts, journals, and balances.
   *
   * @returns Ledger summary payload
   */
  async getLedgerSummary(): Promise<{
    accounts: Account[];
    journals: Journal[];
    balances: Balance[];
    balancesInfo: Record<string, BalanceInfo>;
  }> {
    const accounts = await this.accountModel.find().lean();
    const journals = await this.journalModel.find().lean();
    const balances = await this.balanceModel.find().lean();

    const balancesInfo: Record<string, BalanceInfo> = {};
    for (const balance of balances) {
      balancesInfo[balance.accountId] = {
        currentBalance: balance.currentBalance,
        pendingBalance: 0,
        availableBalance: balance.currentBalance,
      };
    }

    return {
      accounts,
      journals,
      balances,
      balancesInfo,
    };
  }
}
