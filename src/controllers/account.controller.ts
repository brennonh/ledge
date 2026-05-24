import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AccountService,
  AccountWithBalance,
} from '../services/account.service';
import { CreateAccountDto } from '../dtos/account.dto';

@ApiTags('accounts')
@Controller('ledger/accounts')
export class AccountController {
  /**
   * Create an instance of AccountController.
   */
  constructor(private readonly accountService: AccountService) {}

  /**
   * Create a new account and return its balance summary.
   *
   * @param body Account creation payload
   * @returns Created account with balance info
   */
  @Post()
  async createAccount(
    @Body() body: CreateAccountDto,
  ): Promise<AccountWithBalance> {
    return this.accountService.createAccount(
      body.accountId,
      body.name,
      body.type,
      body.openingBalance ?? 0,
    );
  }

  /**
   * Retrieve all accounts with balance summaries.
   *
   * @returns List of accounts with balances
   */
  @Get()
  async getAllAccounts(): Promise<AccountWithBalance[]> {
    return this.accountService.getAllAccounts();
  }

  /**
   * Retrieve a single account with its balance summary.
   *
   * @param accountId Account identifier
   * @returns Account with balance info or null
   */
  @Get(':accountId')
  async getAccount(
    @Param('accountId') accountId: string,
  ): Promise<AccountWithBalance> {
    const account = await this.accountService.getAccount(accountId);
    if (!account) {
      throw new NotFoundException(`Account with id ${accountId} not found`);
    }
    return account;
  }
}
