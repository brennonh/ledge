import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
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

  @Get('status/:status')
  async getJournalsByStatus(
    @Param('status') status: JournalStatus,
  ): Promise<Journal[]> {
    return this.journalService.getJournalsByStatus(status);
  }

  @Get(':journalId')
  async getJournal(
    @Param('journalId') journalId: string,
  ): Promise<Journal | null> {
    return this.journalService.getJournal(journalId);
  }

  @Put(':journalId/authorize')
  async authorizeJournal(
    @Param('journalId') journalId: string,
  ): Promise<{ message: string }> {
    await this.journalService.authorizeJournal(journalId);
    return { message: `Journal ${journalId} has been authorized` };
  }

  @Put(':journalId/reject')
  async rejectJournal(
    @Param('journalId') journalId: string,
  ): Promise<{ message: string }> {
    await this.journalService.rejectJournal(journalId);
    return { message: `Journal ${journalId} has been rejected` };
  }
}
