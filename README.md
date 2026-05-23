# Ledger System - Double Entry Accounting

## Overview

This ledger system implements the double entry accounting model with status-based journal authorization and three-tier balance tracking. The following components work together:

### Entities

#### Account

- **accountId**: Unique identifier for the account
- **name**: Name of the account

Example: "ACC001" - "Cash Account"

#### Transaction

- **amount**: Integer amount value
- **accountId**: The account identifier this transaction belongs to

In double entry accounting, every transaction creates two entries (debit and credit).

#### Journal

- **journalId**: Unique identifier for the journal
- **description**: Description of the journal entry
- **transactions**: Array of transactions associated with this journal
- **status**: Journal state (`preauth`, `authorized`, or `rejected`)
  - **preauth**: Initial status when journal is created. Transactions are recorded but balances are NOT updated.
  - **authorized**: Journal is approved. All transactions are applied to account balances.
  - **rejected**: Journal is declined. Pending transactions are discarded.

#### Balance

- **balanceId**: Unique identifier for the balance record
- **accountId**: The account this balance belongs to
- **currentBalance**: The authorized balance (only includes authorized transactions)

Balance also provides three calculated values:

- **currentBalance**: Stored balance reflecting only authorized transactions
- **pendingBalance**: Sum of all transactions in preauth journals for this account
- **availableBalance**: currentBalance - pendingBalance (funds available for new transactions)

## API Endpoints

### Accounts

- `POST /ledger/accounts` - Create a new account
- `GET /ledger/accounts` - Get all accounts
- `GET /ledger/accounts/:accountId` - Get a specific account

### Journals

- `POST /ledger/journals` - Create a new journal (status: preauth)
- `GET /ledger/journals` - Get all journals
- `GET /ledger/journals/:journalId` - Get a specific journal
- `GET /ledger/journals/status/:status` - Get journals by status (preauth, authorized, rejected)
- `PUT /ledger/journals/:journalId/authorize` - Authorize journal and apply transactions to balances
- `PUT /ledger/journals/:journalId/reject` - Reject journal and discard transactions

### Transactions



### Balances

- `GET /ledger/balances` - Get all balance records
- `GET /ledger/balances/:accountId` - Get balance for specific account (current balance only)
- `GET /ledger/balances-info/:accountId` - Get complete balance info with pending and available amounts

### Summary

- `GET /ledger/summary` - Get complete ledger summary (accounts, journals, balances, and balance info)

## Example Usage

### 1. Create Accounts

```json
POST /ledger/accounts
{
  "accountId": "ACC001",
  "name": "Cash",
  "type": "asset"
}
```

```json
POST /ledger/accounts
{
  "accountId": "ACC002",
  "name": "Expenses"
}
```

### 2. Create Balances

```json
POST /ledger/balances
{
  "balanceId": "BAL001",
  "accountId": "ACC001",
  "initialBalance": 1000
}
```

```json
POST /ledger/balances
{
  "balanceId": "BAL002",
  "accountId": "ACC002",
  "initialBalance": 0
}
```

### 3. Create Journal (Status: preauth)

```json
POST /ledger/journals
{
  "journalId": "JNL001",
  "description": "Daily transactions"
}
```

Response:

```json
{
  "journalId": "JNL001",
  "description": "Daily transactions",
  "transactions": [],
  "status": "preauth"
}
```

### 4. Add Transactions to Journal (Preauth)

```json
POST /ledger/transactions
{
  "journalId": "JNL001",
  "amount": 100,
  "debitAccountId": "ACC001",
  "creditAccountId": "ACC002"
}
```

At this point:

- Transactions are recorded in the journal
- Journal status is still `preauth`
- **Balances are NOT updated yet**
- Pending balance for ACC001 = +100
- Available balance for ACC001 = 1000 - 100 = 900

### 5. Check Balance Info (Before Authorization)

```json
GET /ledger/balances-info/ACC001
```

Response:

```json
{
  "currentBalance": 1000,
  "pendingBalance": 100,
  "availableBalance": 900
}
```

### 6. Authorize Journal

```json
PUT /ledger/journals/JNL001/authorize
```

Response:

```json
{
  "message": "Journal JNL001 has been authorized"
}
```

**After authorization:**

- Journal status changes to `authorized`
- Transactions are applied to account balances
- Current balance for ACC001 = 900
- Pending balance for ACC001 = 0 (no more preauth transactions)
- Available balance for ACC001 = 900

### 7. Check Balance Info (After Authorization)

```json
GET /ledger/balances-info/ACC001
```

Response:

```json
{
  "currentBalance": 900,
  "pendingBalance": 0,
  "availableBalance": 900
}
```

### Alternative: Reject Journal

Instead of authorizing, you can reject:

```json
PUT /ledger/journals/JNL001/reject
```

Response:

```json
{
  "message": "Journal JNL001 has been rejected"
}
```

**After rejection:**

- Journal status changes to `rejected`
- Transactions are discarded
- Account balances remain unchanged
- Pending balance returns to 0

## Key Features

✅ **Double Entry Accounting**: Every transaction creates balanced debit/credit entries  
✅ **Status-Based Authorization**: Control when transactions affect balances with preauth/authorized workflow  
✅ **Three-Tier Balances**: Track current, pending, and available balances per account  
✅ **Account Management**: Create and manage multiple accounts  
✅ **Journal Tracking**: Organize transactions in journals with descriptions  
✅ **Flexible Transaction Control**: Review and approve/reject transactions before applying them  
✅ **Summary View**: Complete ledger overview with all accounts, journals, and balances

## Running the Application

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
