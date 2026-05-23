import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { Balance } from '../schemas/balance.schema';
import { BalanceInfo } from '../entities/balance.entity';
import { CreateBalanceDto } from '../dtos/balance.dto';

@ApiTags('balances')
@Controller('ledger/balances')
export class BalanceController {
  /**
   * Create an instance of BalanceController.
   */
  constructor(private readonly accountService: AccountService) {}

  // @Post()
  // async createBalance(@Body() body: CreateBalanceDto): Promise<Balance> {
  //   return this.accountService.createBalance(
  //     body.balanceId,
  //     body.accountId,
  //     body.initialBalance,
  //   );
  // }

  /**
   * Retrieve all balance documents.
   *
   * @returns List of balances
   */
  @Get()
  async getAllBalances(): Promise<Balance[]> {
    return this.accountService.getAllBalances();
  }

  /**
   * Retrieve a raw balance by account id.
   *
   * @param accountId Account identifier
   * @returns Balance document or null
   */
  @Get(':accountId')
  async getBalance(
    @Param('accountId') accountId: string,
  ): Promise<Balance | null> {
    return this.accountService.getBalance(accountId);
  }

  /**
   * Retrieve balance summary for an account.
   *
   * @param accountId Account identifier
   * @returns Balance info or undefined
   */
  @Get(':accountId/info')
  async getBalanceInfo(
    @Param('accountId') accountId: string,
  ): Promise<BalanceInfo | undefined> {
    return this.accountService.getBalanceInfo(accountId);
  }
}
