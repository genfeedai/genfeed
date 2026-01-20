import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { JobResult, LLMJobData } from '@/interfaces/job-data.interface';
import { JOB_STATUS, QUEUE_CONCURRENCY, QUEUE_NAMES } from '@/queue/queue.constants';
import type { ExecutionsService } from '@/services/executions.service';
import type { QueueManagerService } from '@/services/queue-manager.service';
import type { ReplicateService } from '@/services/replicate.service';

@Processor(QUEUE_NAMES.LLM_GENERATION, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.LLM_GENERATION],
})
export class LLMProcessor extends WorkerHost {
  private readonly logger = new Logger(LLMProcessor.name);

  constructor(
    @Inject(forwardRef(() => 'QueueManagerService'))
    private readonly queueManager: QueueManagerService,
    @Inject(forwardRef(() => 'ExecutionsService'))
    private readonly executionsService: ExecutionsService,
    @Inject(forwardRef(() => 'ReplicateService'))
    private readonly replicateService: ReplicateService
  ) {
    super();
  }

  async process(job: Job<LLMJobData>): Promise<JobResult> {
    const { executionId, nodeId, nodeData } = job.data;

    this.logger.log(`Processing LLM generation job: ${job.id} for node ${nodeId}`);

    try {
      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.ACTIVE);

      // Update node status in execution
      await this.executionsService.updateNodeResult(executionId, nodeId, 'processing');

      // Update progress
      await job.updateProgress({ percent: 20, message: 'Starting LLM generation' });
      await this.queueManager.addJobLog(job.id as string, 'Starting LLM generation');

      // Call Replicate service (LLM is synchronous, doesn't return prediction ID)
      const text = await this.replicateService.generateText({
        prompt: nodeData.prompt,
        systemPrompt: nodeData.systemPrompt,
        maxTokens: nodeData.maxTokens,
        temperature: nodeData.temperature,
        topP: nodeData.topP,
      });

      await job.updateProgress({ percent: 90, message: 'Text generated' });

      const result: JobResult = {
        success: true,
        output: { text },
      };

      // Update execution node result
      await this.executionsService.updateNodeResult(executionId, nodeId, 'complete', { text });

      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.COMPLETED, {
        result: result as unknown as Record<string, unknown>,
      });

      await job.updateProgress({ percent: 100, message: 'Completed' });
      await this.queueManager.addJobLog(job.id as string, 'LLM generation completed');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.FAILED, {
        error: errorMessage,
        attemptsMade: job.attemptsMade,
      });

      await this.executionsService.updateNodeResult(
        executionId,
        nodeId,
        'error',
        undefined,
        errorMessage
      );

      // If this was the last attempt, move to DLQ
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        await this.queueManager.moveToDeadLetterQueue(
          job.id as string,
          QUEUE_NAMES.LLM_GENERATION,
          errorMessage
        );
      }

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<LLMJobData>): void {
    this.logger.log(`LLM job completed: ${job.id} for node ${job.data.nodeId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<LLMJobData>, error: Error): void {
    this.logger.error(`LLM job failed: ${job.id} for node ${job.data.nodeId}`, error.stack);
  }
}
