import { WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { NodeJobData } from '@/interfaces/job-data.interface';
import { JOB_STATUS, type QueueName } from '@/queue/queue.constants';
import type { ExecutionsService } from '@/services/executions.service';
import type { QueueManagerService } from '@/services/queue-manager.service';

export interface ProcessorErrorContext {
  queueManager: QueueManagerService;
  executionsService: ExecutionsService;
  queueName: QueueName;
}

/**
 * Base processor class with shared error handling logic
 * All processors should extend this class to avoid duplicating error handling code
 */
export abstract class BaseProcessor<T extends NodeJobData> extends WorkerHost {
  protected abstract readonly logger: Logger;
  protected abstract readonly queueName: QueueName;
  protected abstract readonly queueManager: QueueManagerService;
  protected abstract readonly executionsService: ExecutionsService;

  /**
   * Handles processor errors with consistent logic across all processors:
   * 1. Updates job status to FAILED
   * 2. Updates node result to error
   * 3. Moves to DLQ on last attempt
   * 4. Triggers continuation for sequential execution
   *
   * For 429 rate limit errors, extracts retry_after and applies appropriate delay
   */
  protected async handleProcessorError(job: Job<T>, error: Error): Promise<never> {
    const { executionId, workflowId, nodeId } = job.data;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 3) - 1;

    // Check for rate limit (429) error and extract retry_after
    const retryAfter = this.extractRetryAfter(errorMessage);
    if (retryAfter && !isLastAttempt) {
      this.logger.warn(`Rate limited (429) for job ${job.id}, will retry after ${retryAfter}s`);
      // Add extra buffer to the retry_after time
      const delayMs = (retryAfter + 2) * 1000;
      await job.moveToDelayed(Date.now() + delayMs);
    }

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

    // If this was the last attempt, handle failure
    if (isLastAttempt) {
      await this.queueManager.moveToDeadLetterQueue(job.id as string, this.queueName, errorMessage);

      // Trigger continuation to process next nodes or complete execution
      await this.queueManager.continueExecution(executionId, workflowId);
    }

    throw error;
  }

  /**
   * Extract retry_after value from 429 error message
   * Returns seconds to wait, or null if not a rate limit error
   */
  private extractRetryAfter(errorMessage: string): number | null {
    // Check if it's a 429 error
    if (!errorMessage.includes('429') && !errorMessage.includes('Too Many Requests')) {
      return null;
    }

    // Try to extract retry_after from the error message
    // Format: "retry_after":8 or "retry_after": 8
    const match = errorMessage.match(/"retry_after":\s*(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Default to 10 seconds if we can't extract the value
    return 10;
  }

  /**
   * Update job progress and add log entry in one call
   */
  protected async updateProgressWithLog(
    job: Job<T>,
    percent: number,
    message: string
  ): Promise<void> {
    await job.updateProgress({ percent, message });
    await this.queueManager.addJobLog(job.id as string, message);
  }

  /**
   * Log job completion event
   */
  protected logJobCompleted(job: Job<T>, jobType: string): void {
    this.logger.log(`${jobType} job completed: ${job.id} for node ${job.data.nodeId}`);
  }

  /**
   * Log job failure event
   */
  protected logJobFailed(job: Job<T>, error: Error, jobType: string): void {
    this.logger.error(`${jobType} job failed: ${job.id} for node ${job.data.nodeId}`, error.stack);
  }
}
