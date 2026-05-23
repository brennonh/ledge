import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class EtherfiSpendDto {
  @ApiProperty({ example: 'JNL001' })
  @IsString()
  journalId!: string;

  @ApiProperty({ example: 'ACC001' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount!: number;
}
