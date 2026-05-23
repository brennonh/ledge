import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BalanceDocument = Balance & Document;

@Schema({ timestamps: true })
export class Balance {
  @Prop({ required: true, unique: true })
  balanceId!: string;

  @Prop({ required: true })
  accountId!: string;

  @Prop({ required: true, default: 0 })
  currentBalance!: number;
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);
