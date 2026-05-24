import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { Transaction } from '../entities/transaction.entity';

describe('JournalService', () => {
  let service: JournalService;
  const mockSession: any = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
  const mockJournalModel: any = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    startSession: jest.fn().mockResolvedValue(mockSession),
  };
  const mockLeanQuery = (value: any) => ({
    lean: jest.fn().mockResolvedValue(value),
    session: jest.fn().mockReturnThis(),
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
    const mockSave = jest.fn().mockResolvedValue(undefined);
    const mockFindOne = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue({
        journalId: 'JNL_AUTH',
        status: 'preauth',
        transactions: [
          { accountId: 'ACC1', amount: 100 },
          { accountId: 'ACC2', amount: -100 },
        ],
        save: mockSave,
      }),
    });
    mockJournalModel.findOne = mockFindOne;
    mockJournalModel.startSession.mockResolvedValue(mockSession);

    const journal = {
      journalId: 'JNL_AUTH',
      status: 'preauth',
      transactions: [
        { accountId: 'ACC1', amount: 100 },
        { accountId: 'ACC2', amount: -100 },
      ],
      save: mockSave,
    };

    // Mock the session's query return
    mockFindOne.mockReturnValue({
      session: jest.fn().mockReturnValue(Promise.resolve(journal)),
    });
    // But actually make it return the journal directly
    mockJournalModel.findOne.mockImplementation(() => ({
      session: jest.fn().mockReturnThis(),
      then: jest.fn((cb: any) => cb(journal)),
    }));

    await service.authorizeJournal('JNL_AUTH');

    expect(mockAccountService.updateBalance).toHaveBeenCalledWith(
      'ACC1',
      100,
      mockSession,
    );
    expect(mockAccountService.updateBalance).toHaveBeenCalledWith(
      'ACC2',
      -100,
      mockSession,
    );
    expect(mockSave).toHaveBeenCalledWith({ session: mockSession });
    expect(mockSession.commitTransaction).toHaveBeenCalled();
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
