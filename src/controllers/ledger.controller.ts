import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LedgerService } from '../services/ledger.service';
import { Account } from '../schemas/account.schema';
import { Journal } from '../schemas/journal.schema';
import { Balance } from '../schemas/balance.schema';
import { BalanceInfo } from '../entities/balance.entity';

@ApiTags('ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('summary')
  async getLedgerSummary(): Promise<{
    accounts: Account[];
    journals: Journal[];
    balances: Balance[];
    balancesInfo: Record<string, BalanceInfo>;
  }> {
    return this.ledgerService.getLedgerSummary();
  }
}
