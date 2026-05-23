# Ledger System - Double Entry Accounting

## Overview

This ledger system implements the double entry accounting model with status-based journal authorization and balance tracking.

### Core Concepts

#### Account

- `accountId`: Unique account identifier
- `name`: Account display name
- `type`: `asset` or `liability`
- `openingBalance`: Optional starting balance

#### Transaction

- `amount`: Numeric value
- `accountId`: Target account

Every journal must contain balanced transactions: debits and credits must cancel out.

#### Journal

- `journalId`: Unique identifier
- `description`: Journal description
- `transactions`: Debit/credit entries
- `status`: `preauth`, `authorized`, or `rejected`

#### Balance

- `balanceId`: Unique balance record ID
- `accountId`: Linked account
- `currentBalance`: Authorized balance

Also exposed:

- `pendingBalance`: Sum of amounts in preauth journals for the account
- `availableBalance`: `currentBalance - pendingBalance`

## Setup

### MongoDB

This app uses MongoDB for persistence.

#### Start MongoDB locally

```bash
docker run --name etherfi-mongo -p 27017:27017 -d mongo:7
```

#### Configure MongoDB connection

By default the app connects to:

```bash
mongodb://localhost:27017/etherfi-ledger
```

You can override it with:

```bash
export MONGODB_URI='mongodb://localhost:27017/etherfi-ledger'
```

### Etherfi asset account config

The spend flow requires an asset account id.

```bash
export ETHERFI_ASSET_ACCOUNT_ID=ACC_ASSET_1
```

If this env var is not set, the app will fall back to the first account with type `asset`.

## Run the App

```bash
npm install
npm run start:dev
```

The server starts at `http://localhost:3000`.

## API Endpoints

### Accounts

- `POST /ledger/accounts` - create an account
- `GET /ledger/accounts` - list all accounts
- `GET /ledger/accounts/:accountId` - get an account with balance info

### Journals

- `POST /ledger/journals` - create a journal (`preauth`)
- `GET /ledger/journals` - list all journals
- `GET /ledger/journals/:journalId` - get a journal
- `GET /ledger/journals/status/:status` - list journals by status
- `PUT /ledger/journals/:journalId/authorize` - authorize a journal
- `PUT /ledger/journals/:journalId/reject` - reject a journal

### Transactions

- `GET /ledger/transactions/:accountId` - list authorized transactions for an account

### Balances

- `GET /ledger/balances` - list all balances
- `GET /ledger/balances/:accountId` - get the raw balance record for an account
- `GET /ledger/balances/:accountId/info` - get current, pending, and available balances

### Ledger Summary

- `GET /ledger/summary` - get accounts, journals, balances, and balance info

### Etherfi Spend

- `POST /etherfi/spend` - create a spend journal that debits the configured asset account and credits the provided account

## Example Usage

### 1. Create an Asset Account

```http
POST /ledger/accounts
Content-Type: application/json

{
  "accountId": "ACC_ASSET_1",
  "name": "Etherfi Asset Account",
  "type": "asset",
  "openingBalance": 100000
}
```

### 2. Create a Liability Account

```http
POST /ledger/accounts
Content-Type: application/json

{
  "accountId": "ACC_LIABILITY_1",
  "name": "Customer Payable",
  "type": "liability",
  "openingBalance": 0
}
```

### 3. Create a Spend Request

Set the env var for the asset account and start the app:

```bash
export ETHERFI_ASSET_ACCOUNT_ID=ACC_ASSET_1
npm run start:dev
```

Then call:

```http
POST /etherfi/spend
Content-Type: application/json

{
  "journalId": "JNL_SPEND_001",
  "accountId": "ACC_LIABILITY_1",
  "amount": 500
}
```

This creates a journal with two transactions:

- debit `ACC_ASSET_1` for `500`
- credit `ACC_LIABILITY_1` for `-500`

### 4. Authorize the Spend Journal

```http
PUT /ledger/journals/JNL_SPEND_001/authorize
```

### 5. Check Balance Info

```http
GET /ledger/balances/ACC_ASSET_1/info
```

```http
GET /ledger/balances/ACC_LIABILITY_1/info
```

## Notes

- `journalId` must be unique. Creating a journal with an existing `journalId` returns an error.
- `accountId` must be unique for accounts.
- Account responses include `currentBalance`, `pendingBalance`, and `availableBalance`.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
