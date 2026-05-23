import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateBalanceDto {
  @ApiProperty({ example: 'BAL001' })
  @IsString()
  balanceId!: string;

  @ApiProperty({ example: 'ACC001' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
