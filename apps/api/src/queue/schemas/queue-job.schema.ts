import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, type HydratedDocument, Types } from 'mongoose';
import { JOB_STATUS, QUEUE_NAMES } from '../queue.constants';

export type QueueJobDocument = HydratedDocument<QueueJob>;

@Schema({ _id: false })
class JobLog {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['info', 'warn', 'error', 'debug'] })
  level: string;
}

@Schema({ timestamps: true, collection: 'queue_jobs' })
export class QueueJob extends Document {
  @Prop({ required: true, index: true })
  bullJobId: string;

  @Prop({ required: true, enum: Object.values(QUEUE_NAMES), index: true })
  queueName: string;

  @Prop({ type: Types.ObjectId, ref: 'Execution', required: true, index: true })
  executionId: Types.ObjectId;

  @Prop({ required: true })
  nodeId: string;

  @Prop({
    required: true,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.PENDING,
    index: true,
  })
  status: string;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;

  @Prop({ type: Object })
  result?: Record<string, unknown>;

  @Prop()
  error?: string;

  @Prop({ default: 0 })
  attemptsMade: number;

  @Prop()
  processedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  failedReason?: string;

  @Prop({ type: [Object], default: [] })
  logs: JobLog[];

  @Prop({ default: false, index: true })
  movedToDlq: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const QueueJobSchema = SchemaFactory.createForClass(QueueJob);

// Compound indexes for common queries
QueueJobSchema.index({ executionId: 1, status: 1 });
QueueJobSchema.index({ queueName: 1, status: 1 });
QueueJobSchema.index({ status: 1, updatedAt: 1 }); // For recovery queries
QueueJobSchema.index({ movedToDlq: 1, createdAt: -1 }); // For DLQ management
