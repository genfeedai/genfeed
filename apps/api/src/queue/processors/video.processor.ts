import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { ExecutionsService } from '../../executions/executions.service';
import type { ReplicateService } from '../../replicate/replicate.service';
import type { JobResult, VideoJobData } from '../interfaces/job-data.interface';
import { JOB_STATUS, QUEUE_CONCURRENCY, QUEUE_NAMES } from '../queue.constants';
import type { QueueManagerService } from '../services/queue-manager.service';

@Processor(QUEUE_NAMES.VIDEO_GENERATION, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.VIDEO_GENERATION],
})
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

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

  async process(job: Job<VideoJobData>): Promise<JobResult> {
    const { executionId, nodeId, nodeData } = job.data;

    this.logger.log(`Processing video generation job: ${job.id} for node ${nodeId}`);

    try {
      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.ACTIVE);

      // Update node status in execution
      await this.executionsService.updateNodeResult(executionId, nodeId, 'processing');

      // Update progress
      await job.updateProgress({ percent: 5, message: 'Starting video generation' });
      await this.queueManager.addJobLog(job.id as string, 'Starting video generation');

      // Call Replicate service
      const model = nodeData.model ?? 'veo-3.1-fast';
      const prediction = await this.replicateService.generateVideo(executionId, nodeId, model, {
        prompt: nodeData.prompt,
        image: nodeData.image,
        lastFrame: nodeData.lastFrame,
        referenceImages: nodeData.referenceImages,
        duration: nodeData.duration,
        aspectRatio: nodeData.aspectRatio,
        resolution: nodeData.resolution,
        generateAudio: nodeData.generateAudio,
        negativePrompt: nodeData.negativePrompt,
        seed: nodeData.seed,
      });

      await job.updateProgress({ percent: 15, message: 'Prediction created' });
      await this.queueManager.addJobLog(job.id as string, `Created prediction: ${prediction.id}`);

      // Poll for completion (video takes longer)
      const result = await this.pollForCompletion(prediction.id, job);

      // Update job status
      await this.queueManager.updateJobStatus(job.id as string, JOB_STATUS.COMPLETED, {
        result: result as unknown as Record<string, unknown>,
      });

      await this.queueManager.addJobLog(job.id as string, 'Video generation completed');

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
          QUEUE_NAMES.VIDEO_GENERATION,
          errorMessage
        );
      }

      throw error;
    }
  }

  /**
   * Poll Replicate for prediction completion
   * Video generation takes longer, so we use longer intervals
   */
  private async pollForCompletion(
    predictionId: string,
    job: Job<VideoJobData>
  ): Promise<JobResult> {
    const maxAttempts = 120; // 20 minutes with 10 second intervals
    const pollInterval = 10000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const prediction = await this.replicateService.getPredictionStatus(predictionId);

      const progress = 15 + Math.min(attempt * 0.7, 80); // Progress from 15% to 95%
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
      error: 'Video prediction timed out',
      predictionId,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<VideoJobData>): void {
    this.logger.log(`Video job completed: ${job.id} for node ${job.data.nodeId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<VideoJobData>, error: Error): void {
    this.logger.error(`Video job failed: ${job.id} for node ${job.data.nodeId}`, error.stack);
  }
}
