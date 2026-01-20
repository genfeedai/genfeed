import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { ImageJobData, JobResult } from '@/interfaces/job-data.interface';
import { JOB_STATUS, QUEUE_CONCURRENCY, QUEUE_NAMES } from '@/queue/queue.constants';
import type { ExecutionsService } from '@/services/executions.service';
import type { QueueManagerService } from '@/services/queue-manager.service';
import type { ReplicateService } from '@/services/replicate.service';

@Processor(QUEUE_NAMES.IMAGE_GENERATION, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.IMAGE_GENERATION],
})
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

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

  async process(job: Job<ImageJobData>): Promise<JobResult> {
    const { executionId, nodeId, nodeData } = job.data;

    this.logger.log(`Processing image generation job: ${job.id} for node ${nodeId}`);

    try {
      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.ACTIVE);

      // Update node status in execution
      await this.executionsService.updateNodeResult(executionId, nodeId, 'processing');

      // Update progress
      await job.updateProgress({ percent: 10, message: 'Starting image generation' });
      await this.queueManager.addJobLog(job.id as string, 'Starting image generation');

      // Call Replicate service
      const model = nodeData.model ?? 'nano-banana';
      const prediction = await this.replicateService.generateImage(executionId, nodeId, model, {
        prompt: nodeData.prompt,
        imageInput: nodeData.imageInput,
        aspectRatio: nodeData.aspectRatio,
        resolution: nodeData.resolution,
        outputFormat: nodeData.outputFormat,
      });

      await job.updateProgress({ percent: 30, message: 'Prediction created' });
      await this.queueManager.addJobLog(job.id as string, `Created prediction: ${prediction.id}`);

      // Poll for completion (Replicate webhooks will also update, but we poll as backup)
      const result = await this.pollForCompletion(prediction.id, job);

      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.COMPLETED, {
        result: result as unknown as Record<string, unknown>,
      });

      await this.queueManager.addJobLog(job.id as string, 'Image generation completed');

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
          QUEUE_NAMES.IMAGE_GENERATION,
          errorMessage
        );
      }

      throw error;
    }
  }

  /**
   * Poll Replicate for prediction completion
   */
  private async pollForCompletion(
    predictionId: string,
    job: Job<ImageJobData>
  ): Promise<JobResult> {
    const maxAttempts = 60; // 5 minutes with 5 second intervals
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const prediction = await this.replicateService.getPredictionStatus(predictionId);

      const progress = 30 + Math.min(attempt * 1.1, 60); // Progress from 30% to 90%
      await job.updateProgress({
        percent: progress,
        message: `Status: ${prediction.status}`,
      });

      if (prediction.status === 'succeeded') {
        await job.updateProgress({ percent: 100, message: 'Completed' });
        return {
          success: true,
          output: prediction.output as Record<string, unknown>,
          predictionId,
          predictTime: prediction.metrics?.predict_time,
        };
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return {
          success: false,
          error: prediction.error ?? `Prediction ${prediction.status}`,
          predictionId,
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Timeout
    return {
      success: false,
      error: 'Prediction timed out',
      predictionId,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ImageJobData>): void {
    this.logger.log(`Image job completed: ${job.id} for node ${job.data.nodeId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ImageJobData>, error: Error): void {
    this.logger.error(`Image job failed: ${job.id} for node ${job.data.nodeId}`, error.stack);
  }
}
