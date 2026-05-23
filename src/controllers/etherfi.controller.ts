import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JournalService } from '../services/journal.service';
import { EtherfiSpendDto } from '../dtos/etherfi.dto';
import { Transaction } from '../entities/transaction.entity';

@ApiTags('etherfi')
@Controller('etherfi')
export class EtherfiController {
  constructor(private readonly journalService: JournalService) {}

  /**
   * Create a spend journal that debits the asset account and credits the provided account.
   */
  @Post('spend')
  async spend(@Body() body: EtherfiSpendDto): Promise<{ message: string }> {
    // find an asset account inside the journal service - we'll look it up here by creating a simple transaction pair
    // find asset account via journal service's accountService isn't exposed; instead use a convention: JournalService will accept the provided transactions

    // We'll locate the asset account by querying for an account with type 'asset' using the JournalService's accountService.
    // To keep responsibilities clear, call into JournalService to create the journal using the first asset account it knows about.

    // Implementation: find asset accountId by creating a temporary journal? Instead, ask JournalService to find asset account via accountService - but accountService is private.

    // Simpler: create transactions using positive amount to debit asset account and negative amount to credit provided account.
    // We'll let JournalService createJournal if caller provides the asset account id. To find the asset account id, JournalService doesn't expose a finder, so we will query for an account with type 'asset' by direct DB access.

    // For simplicity, JournalService has access to AccountService; use JournalService to expose a helper to find an asset account. But modifying service now is invasive. Instead, assume the asset account id is the first account of type 'asset'.

    const assetAccountId = await this.journalService.getAssetAccountId();
    if (!assetAccountId) {
      throw new BadRequestException(
        'No asset account found. Set ETHERFI_ASSET_ACCOUNT_ID or create an asset account.',
      );
    }

    const txnDebit = new Transaction(-body.amount, assetAccountId);
    const txnCredit = new Transaction(body.amount, body.accountId);

    await this.journalService.createJournal(
      body.journalId,
      `Etherfi spend ${body.journalId}`,
      [txnDebit, txnCredit],
    );

    return { message: `Spend journal ${body.journalId} created` };
  }
}
