import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  JournalTransaction,
  JournalTransactionSchema,
} from './transaction.schema';

export type JournalDocument = Journal & Document;

export type JournalStatus = 'preauth' | 'authorized' | 'rejected';

@Schema({ timestamps: true })
export class Journal {
  @Prop({ required: true, unique: true })
  journalId!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [JournalTransactionSchema], default: [] })
  transactions!: JournalTransaction[];

  @Prop({
    required: true,
    default: 'preauth',
    enum: ['preauth', 'authorized', 'rejected'],
  })
  status!: JournalStatus;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const JournalSchema = SchemaFactory.createForClass(Journal);
