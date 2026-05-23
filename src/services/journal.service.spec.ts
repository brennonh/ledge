import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { Transaction } from '../entities/transaction.entity';

describe('JournalService', () => {
  let service: JournalService;
  const mockJournalModel: any = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };
  const mockLeanQuery = (value: any) => ({
    lean: jest.fn().mockResolvedValue(value),
  });
  const mockAccountService: any = {
    updateBalance: jest.fn(),
    getAccount: jest.fn(),
    findFirstAccountIdByType: jest.fn(),
  };
  const mockConfigService: any = {
    getEtherfiAssetAccountId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JournalService(
      mockJournalModel,
      mockAccountService,
      mockConfigService,
    );
  });

  it('creates a balanced preauth journal', async () => {
    mockJournalModel.findOne.mockReturnValue(mockLeanQuery(null));
    mockJournalModel.create.mockResolvedValue({
      journalId: 'JNL1',
      description: 'Test',
      transactions: [],
      status: 'preauth',
    });

    const result = await service.createJournal('JNL1', 'Test', [
      new Transaction(100, 'ACC1'),
      new Transaction(-100, 'ACC2'),
    ]);

    expect(mockJournalModel.findOne).toHaveBeenCalledWith({
      journalId: 'JNL1',
    });
    expect(mockJournalModel.create).toHaveBeenCalledWith({
      journalId: 'JNL1',
      description: 'Test',
      transactions: expect.any(Array),
      status: 'preauth',
    });
    expect(result).toEqual({
      journalId: 'JNL1',
      description: 'Test',
      transactions: [],
      status: 'preauth',
    });
  });

  it('rejects unbalanced journal transactions', async () => {
    await expect(
      service.createJournal('JNL_BAD', 'Bad', [new Transaction(100, 'ACC1')]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects duplicate journal ids', async () => {
    mockJournalModel.findOne.mockReturnValue(
      mockLeanQuery({ journalId: 'JNL_DUP' }),
    );
    await expect(service.createJournal('JNL_DUP', 'Dup', [])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects transaction posting when journal is missing', async () => {
    mockJournalModel.findOne.mockResolvedValue(null);
    await expect(
      service.createTransactionAndPost('MISSING', 100, 'ACC1', 'ACC2'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects posting to non-preauth journals', async () => {
    mockJournalModel.findOne.mockResolvedValue({
      status: 'authorized',
      transactions: [],
      save: jest.fn(),
    });
    await expect(
      service.createTransactionAndPost('JNL_AUTH', 100, 'ACC1', 'ACC2'),
    ).rejects.toThrow(BadRequestException);
  });

  it('authorizes only preauth journals and updates balances', async () => {
    const mockSave = jest.fn();
    mockJournalModel.findOne.mockResolvedValue({
      journalId: 'JNL_AUTH',
      status: 'preauth',
      transactions: [
        { accountId: 'ACC1', amount: 100 },
        { accountId: 'ACC2', amount: -100 },
      ],
      save: mockSave,
    });

    await service.authorizeJournal('JNL_AUTH');

    expect(mockAccountService.updateBalance).toHaveBeenCalledWith('ACC1', 100);
    expect(mockAccountService.updateBalance).toHaveBeenCalledWith('ACC2', -100);
    expect(mockSave).toHaveBeenCalled();
  });

  it('returns env asset account id when configured and valid', async () => {
    mockConfigService.getEtherfiAssetAccountId.mockReturnValue('ACC_ASSET_1');
    mockAccountService.getAccount.mockResolvedValue({
      accountId: 'ACC_ASSET_1',
    });

    const result = await service.getAssetAccountId();
    expect(result).toBe('ACC_ASSET_1');
  });

  it('falls back to first asset account when env is unset', async () => {
    mockConfigService.getEtherfiAssetAccountId.mockReturnValue(null);
    mockAccountService.findFirstAccountIdByType.mockResolvedValue(
      'ACC_ASSET_2',
    );

    const result = await service.getAssetAccountId();
    expect(result).toBe('ACC_ASSET_2');
  });
});
