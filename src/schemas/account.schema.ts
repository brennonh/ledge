import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountType = 'asset' | 'liability';
export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true, unique: true })
  accountId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['asset', 'liability'] })
  type!: AccountType;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
