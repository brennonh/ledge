import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JournalTransactionDocument = JournalTransaction & Document;

@Schema({ _id: false })
export class JournalTransaction {
  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  accountId!: string;
}

export const JournalTransactionSchema =
  SchemaFactory.createForClass(JournalTransaction);
