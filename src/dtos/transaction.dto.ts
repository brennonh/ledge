import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class JournalTransactionDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'ACC001' })
  @IsString()
  accountId!: string;
}
