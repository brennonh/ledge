import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  JournalService,
  AuthorizedAccountTransaction,
} from '../services/journal.service';

@ApiTags('transactions')
@Controller('ledger/transactions')
export class TransactionController {
  /**
   * Create an instance of TransactionController.
   */
  constructor(private readonly journalService: JournalService) {}

  /**
   * Retrieve authorized debit and credit transactions for an account.
   *
   * @param accountId Account identifier
   * @returns List of authorized account transactions
   */
  @Get(':accountId')
  async getTransactionsForAccount(
    @Param('accountId') accountId: string,
  ): Promise<AuthorizedAccountTransaction[]> {
    return this.journalService.getAuthorizedTransactionsForAccount(accountId);
  }
}
