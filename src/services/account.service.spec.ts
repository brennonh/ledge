import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  const mockAccountModel: any = {
    create: jest.fn(),
    deleteOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockBalanceModel: any = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockJournalModel: any = {
    find: jest.fn(),
  };

  const mockLeanQuery = (value: any) => ({
    lean: jest.fn().mockResolvedValue(value),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountService(
      mockAccountModel,
      mockBalanceModel,
      mockJournalModel,
    );
  });

  it('creates an account and linked balance record', async () => {
    const account = {
      accountId: 'ACC1',
      name: 'Asset',
      type: 'asset',
      toObject: () => ({ accountId: 'ACC1', name: 'Asset', type: 'asset' }),
    };
    mockAccountModel.create.mockResolvedValue(account);
    mockBalanceModel.create.mockResolvedValue({
      balanceId: 'BAL_ACC1',
      accountId: 'ACC1',
      currentBalance: 100,
    });
    mockAccountModel.findOne.mockReturnValue(mockLeanQuery(null));
    mockBalanceModel.findOne.mockReturnValue(
      mockLeanQuery({ accountId: 'ACC1', currentBalance: 100 }),
    );
    mockJournalModel.find.mockReturnValue(mockLeanQuery([]));

    const result = await service.createAccount('ACC1', 'Asset', 'asset', 100);

    expect(mockAccountModel.create).toHaveBeenCalledWith({
      accountId: 'ACC1',
      name: 'Asset',
      type: 'asset',
    });
    expect(mockBalanceModel.create).toHaveBeenCalledWith({
      balanceId: 'BAL_ACC1',
      accountId: 'ACC1',
      currentBalance: 100,
    });
    expect(result).toMatchObject({
      accountId: 'ACC1',
      name: 'Asset',
      type: 'asset',
      currentBalance: 100,
      pendingBalance: 0,
      availableBalance: 100,
    });
  });

  it('builds balance info from preauth journals', async () => {
    mockBalanceModel.findOne.mockReturnValue(
      mockLeanQuery({ accountId: 'ACC1', currentBalance: 1000 }),
    );
    mockJournalModel.find.mockReturnValue(
      mockLeanQuery([
        {
          status: 'preauth',
          transactions: [
            { accountId: 'ACC1', amount: 150 },
            { accountId: 'OTHER', amount: -150 },
          ],
        },
      ]),
    );

    const info = await service.getBalanceInfo('ACC1');

    expect(info).toEqual({
      currentBalance: 1000,
      pendingBalance: 150,
      availableBalance: 850,
    });
  });

  it('returns null when getting a missing account', async () => {
    mockAccountModel.findOne.mockReturnValue(mockLeanQuery(null));
    const result = await service.getAccount('MISSING');
    expect(result).toBeNull();
  });

  it('finds the first account id by type', async () => {
    mockAccountModel.findOne.mockReturnValue(
      mockLeanQuery({ accountId: 'ACC_ASSET_1' }),
    );
    const result = await service.findFirstAccountIdByType('asset');
    expect(result).toBe('ACC_ASSET_1');
  });

  it('returns null when no account exists for that type', async () => {
    mockAccountModel.findOne.mockReturnValue(mockLeanQuery(null));
    const result = await service.findFirstAccountIdByType('asset');
    expect(result).toBeNull();
  });

  it('cleans up account if balance creation fails', async () => {
    const account = {
      accountId: 'ACC_FAIL',
      name: 'Bad',
      type: 'asset',
      toObject: () => ({ accountId: 'ACC_FAIL', name: 'Bad', type: 'asset' }),
    };
    mockAccountModel.create.mockResolvedValue(account);
    mockBalanceModel.create.mockRejectedValue(new Error('create failed'));

    await expect(
      service.createAccount('ACC_FAIL', 'Bad', 'asset', 0),
    ).rejects.toThrow('create failed');
    expect(mockAccountModel.deleteOne).toHaveBeenCalledWith({
      accountId: 'ACC_FAIL',
    });
  });
});
