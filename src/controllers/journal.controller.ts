import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { JournalStatus } from '../schemas/journal.schema';
import { JournalService } from '../services/journal.service';
import { Journal } from '../schemas/journal.schema';
import { Transaction } from '../entities/transaction.entity';
import { CreateJournalDto } from '../dtos/journal.dto';

@ApiTags('journals')
@Controller('ledger/journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  async createJournal(@Body() body: CreateJournalDto): Promise<Journal> {
    return this.journalService.createJournal(
      body.journalId,
      body.description,
      body.transactions?.map(
        (txn) => new Transaction(txn.amount, txn.accountId),
      ) ?? [],
    );
  }

  @Get()
  async getAllJournals(): Promise<Journal[]> {
    return this.journalService.getAllJournals();
  }

  /**
   * Retrieve journals filtered by status.
   *
   * @param status Journal status filter
   * @returns List of matching journals
   */
  @Get('status/:status')
  async getJournalsByStatus(
    @Param('status') status: JournalStatus,
  ): Promise<Journal[]> {
    return this.journalService.getJournalsByStatus(status);
  }

  /**
   * Retrieve a single journal by its unique ID.
   *
   * @param journalId Journal identifier
   * @returns Journal document
   */
  @Get(':journalId')
  async getJournal(@Param('journalId') journalId: string): Promise<Journal> {
    const journal = await this.journalService.getJournal(journalId);
    if (!journal) {
      throw new NotFoundException(`Journal with id ${journalId} not found`);
    }
    return journal;
  }

  /**
   * Authorize a journal, posting its transactions to account balances.
   *
   * @param journalId Journal identifier
   * @returns Confirmation message
   */
  @Put(':journalId/authorize')
  async authorizeJournal(
    @Param('journalId') journalId: string,
  ): Promise<{ message: string }> {
    await this.journalService.authorizeJournal(journalId);
    return { message: `Journal ${journalId} has been authorized` };
  }

  /**
   * Reject a journal, preventing it from being authorized.
   *
   * @param journalId Journal identifier
   * @returns Confirmation message
   */
  @Put(':journalId/reject')
  async rejectJournal(
    @Param('journalId') journalId: string,
  ): Promise<{ message: string }> {
    await this.journalService.rejectJournal(journalId);
    return { message: `Journal ${journalId} has been rejected` };
  }
}
