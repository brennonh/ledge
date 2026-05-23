import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountController } from './controllers/account.controller';
import { JournalController } from './controllers/journal.controller';
import { BalanceController } from './controllers/balance.controller';
import { LedgerController } from './controllers/ledger.controller';
import { TransactionController } from './controllers/transaction.controller';
import { AccountService } from './services/account.service';
import { JournalService } from './services/journal.service';
import { LedgerService } from './services/ledger.service';
import { Account, AccountSchema } from './schemas/account.schema';
import { Journal, JournalSchema } from './schemas/journal.schema';
import { Balance, BalanceSchema } from './schemas/balance.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/etherfi-ledger',
    ),
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: Journal.name, schema: JournalSchema },
      { name: Balance.name, schema: BalanceSchema },
    ]),
  ],
  controllers: [
    AppController,
    AccountController,
    JournalController,
    BalanceController,
    TransactionController,
    LedgerController,
  ],
  providers: [AppService, AccountService, JournalService, LedgerService],
})
export class AppModule {}
