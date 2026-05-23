import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Ledger E2E', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    const { AppModule } = require('../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongoServer) await mongoServer.stop();
  });

  it('performs the Etherfi spend workflow', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/ledger/accounts')
      .send({
        accountId: 'ACC_ASSET_1',
        name: 'Etherfi Asset Account',
        type: 'asset',
        openingBalance: 100000,
      })
      .expect(201);

    await request(server)
      .post('/ledger/accounts')
      .send({
        accountId: 'ACC_LIABILITY_1',
        name: 'Customer Payable',
        type: 'liability',
        openingBalance: 0,
      })
      .expect(201);

    await request(server)
      .post('/etherfi/spend')
      .send({
        journalId: 'JNL_SPEND_001',
        accountId: 'ACC_LIABILITY_1',
        amount: 500,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toContain(
          'Spend journal JNL_SPEND_001 created',
        );
      });

    await request(server)
      .get('/ledger/journals/JNL_SPEND_001')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('preauth');
      });

    await request(server)
      .put('/ledger/journals/JNL_SPEND_001/authorize')
      .expect(200);

    await request(server)
      .get('/ledger/balances/ACC_ASSET_1/info')
      .expect(200)
      .expect((res) => {
        expect(res.body.currentBalance).toBe(99500);
        expect(res.body.pendingBalance).toBe(0);
        expect(res.body.availableBalance).toBe(99500);
      });

    await request(server)
      .get('/ledger/balances/ACC_LIABILITY_1/info')
      .expect(200)
      .expect((res) => {
        expect(res.body.currentBalance).toBe(500);
        expect(res.body.pendingBalance).toBe(0);
        expect(res.body.availableBalance).toBe(500);
      });
  });
});
