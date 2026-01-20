import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { JOB_STATUS, QUEUE_NAMES } from '@/queue/queue.constants';
import { QueueJob, type QueueJobDocument } from '@/schemas/queue-job.schema';
import { QueueManagerService } from '@/services/queue-manager.service';

interface StalledJob {
  _id: Types.ObjectId;
  bullJobId: string;
  queueName: string;
  executionId: Types.ObjectId;
  nodeId: string;
  data: Record<string, unknown>;
}

@Injectable()
export class JobRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(JobRecoveryService.name);
  private readonly STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(QueueJob.name)
    private readonly queueJobModel: Model<QueueJobDocument>,
    private readonly queueManager: QueueManagerService
  ) {}

  /**
   * On module init, recover any stalled jobs from previous runs
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Checking for stalled jobs to recover...');
    await this.recoverStalledJobs();
  }

  /**
   * Periodically check for stalled jobs (every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledRecovery(): Promise<void> {
    await this.recoverStalledJobs();
  }

  /**
   * Find and re-enqueue stalled jobs
   */
  async recoverStalledJobs(): Promise<number> {
    const staleThreshold = new Date(Date.now() - this.STALE_THRESHOLD_MS);

    // Find jobs that were in-progress when server may have crashed
    const stalledJobs = await this.queueJobModel
      .find({
        status: { $in: [JOB_STATUS.ACTIVE, JOB_STATUS.PENDING] },
        updatedAt: { $lt: staleThreshold },
        movedToDlq: false,
      })
      .lean<StalledJob[]>();

    if (stalledJobs.length === 0) {
      return 0;
    }

    this.logger.warn(`Found ${stalledJobs.length} stalled jobs to recover`);

    let recoveredCount = 0;

    for (const job of stalledJobs) {
      try {
        await this.recoverJob(job);
        recoveredCount++;
      } catch (error) {
        this.logger.error(
          `Failed to recover job ${job.bullJobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.logger.log(`Successfully recovered ${recoveredCount} stalled jobs`);
    return recoveredCount;
  }

  /**
   * Recover a single stalled job
   */
  private async recoverJob(job: StalledJob): Promise<void> {
    this.logger.log(`Recovering stalled job: ${job.bullJobId} from queue ${job.queueName}`);

    // Mark the old job as recovered
    await this.queueJobModel.updateOne(
      { _id: job._id },
      {
        $set: { status: JOB_STATUS.RECOVERED },
        $push: {
          logs: {
            timestamp: new Date(),
            message: 'Job recovered after stall detection',
            level: 'warn',
          },
        },
      }
    );

    // Re-enqueue based on queue type
    if (job.queueName === QUEUE_NAMES.WORKFLOW_ORCHESTRATOR) {
      await this.queueManager.enqueueWorkflow(
        job.executionId.toString(),
        job.data.workflowId as string
      );
    } else {
      // Re-enqueue node job
      await this.queueManager.enqueueNode(
        job.executionId.toString(),
        job.data.workflowId as string,
        job.nodeId,
        job.data.nodeType as string,
        job.data.nodeData as Record<string, unknown>,
        job.data.dependsOn as string[] | undefined
      );
    }
  }

  /**
   * Manually recover a specific execution's incomplete jobs
   */
  async recoverExecution(executionId: string): Promise<number> {
    const incompleteJobs = await this.queueJobModel
      .find({
        executionId: new Types.ObjectId(executionId),
        status: { $nin: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED] },
        movedToDlq: false,
      })
      .lean<StalledJob[]>();

    if (incompleteJobs.length === 0) {
      return 0;
    }

    this.logger.log(
      `Recovering ${incompleteJobs.length} incomplete jobs for execution ${executionId}`
    );

    let recoveredCount = 0;

    for (const job of incompleteJobs) {
      try {
        await this.recoverJob(job);
        recoveredCount++;
      } catch (error) {
        this.logger.error(
          `Failed to recover job ${job.bullJobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return recoveredCount;
  }

  /**
   * Get statistics on job states
   */
  async getJobStats(): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    recovered: number;
    inDlq: number;
  }> {
    const pipeline = [
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          inDlq: [{ $match: { movedToDlq: true } }, { $count: 'count' }],
        },
      },
    ];

    const [result] = await this.queueJobModel.aggregate(pipeline);

    const statusCounts = new Map<string, number>(
      result.byStatus.map(
        (s: { _id: string; count: number }) => [s._id, s.count] as [string, number]
      )
    );

    return {
      total: (result.total[0]?.count as number) ?? 0,
      pending: statusCounts.get(JOB_STATUS.PENDING) ?? 0,
      active: statusCounts.get(JOB_STATUS.ACTIVE) ?? 0,
      completed: statusCounts.get(JOB_STATUS.COMPLETED) ?? 0,
      failed: statusCounts.get(JOB_STATUS.FAILED) ?? 0,
      recovered: statusCounts.get(JOB_STATUS.RECOVERED) ?? 0,
      inDlq: (result.inDlq[0]?.count as number) ?? 0,
    };
  }

  /**
   * Retry a failed job from the DLQ
   */
  async retryFromDlq(bullJobId: string): Promise<string> {
    const job = await this.queueJobModel
      .findOne({
        bullJobId,
        movedToDlq: true,
      })
      .lean<StalledJob>();

    if (!job) {
      throw new Error(`Job ${bullJobId} not found in DLQ`);
    }

    this.logger.log(`Retrying job ${bullJobId} from DLQ`);

    // Reset DLQ flag
    await this.queueJobModel.updateOne(
      { _id: job._id },
      {
        $set: { movedToDlq: false, status: JOB_STATUS.PENDING },
        $push: {
          logs: {
            timestamp: new Date(),
            message: 'Job retried from DLQ',
            level: 'info',
          },
        },
      }
    );

    // Re-enqueue
    if (job.queueName === QUEUE_NAMES.WORKFLOW_ORCHESTRATOR) {
      return this.queueManager.enqueueWorkflow(
        job.executionId.toString(),
        job.data.workflowId as string
      );
    }

    return this.queueManager.enqueueNode(
      job.executionId.toString(),
      job.data.workflowId as string,
      job.nodeId,
      job.data.nodeType as string,
      job.data.nodeData as Record<string, unknown>,
      job.data.dependsOn as string[] | undefined
    );
  }

  /**
   * Get jobs in DLQ for inspection
   */
  async getDlqJobs(limit = 50, offset = 0): Promise<{ jobs: QueueJobDocument[]; total: number }> {
    const [jobs, total] = await Promise.all([
      this.queueJobModel
        .find({ movedToDlq: true })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.queueJobModel.countDocuments({ movedToDlq: true }),
    ]);

    return { jobs, total };
  }
}
