import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'ACC001', description: 'Unique account identifier' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 'Cash' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'asset', enum: ['asset', 'liability'] })
  @IsEnum(['asset', 'liability'])
  type!: 'asset' | 'liability';

  @ApiProperty({ example: 1000, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}
