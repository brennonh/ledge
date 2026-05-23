export class ConfigService {
  private readonly etherfiAssetAccountId?: string;

  constructor() {
    const val = process.env.ETHERFI_ASSET_ACCOUNT_ID;
    if (val !== undefined) {
      if (typeof val !== 'string' || val.trim() === '') {
        throw new Error(
          'Invalid ETHERFI_ASSET_ACCOUNT_ID environment variable',
        );
      }
      this.etherfiAssetAccountId = val.trim();
    }
  }

  getEtherfiAssetAccountId(): string | undefined {
    return this.etherfiAssetAccountId;
  }
}
