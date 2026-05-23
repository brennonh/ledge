import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalTransactionDto } from './transaction.dto';

export class CreateJournalDto {
  @ApiProperty({ example: 'JNL001', description: 'Unique journal identifier' })
  @IsString()
  journalId!: string;

  @ApiProperty({ example: 'Daily transactions' })
  @IsString()
  description!: string;

  @ApiProperty({ type: [JournalTransactionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalTransactionDto)
  transactions?: JournalTransactionDto[];
}
