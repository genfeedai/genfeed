import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageProcessor } from '@/processors/image.processor';
import { JOB_STATUS, QUEUE_NAMES } from '@/queue/queue.constants';

// Mock BullMQ WorkerHost
vi.mock('@nestjs/bullmq', () => ({
  Processor: () => vi.fn(),
  WorkerHost: class {},
  OnWorkerEvent: () => vi.fn(),
}));

describe('ImageProcessor', () => {
  let processor: ImageProcessor;
  let mockQueueManager: {
    updateJobStatus: ReturnType<typeof vi.fn>;
    addJobLog: ReturnType<typeof vi.fn>;
    moveToDeadLetterQueue: ReturnType<typeof vi.fn>;
  };
  let mockExecutionsService: {
    updateNodeResult: ReturnType<typeof vi.fn>;
  };
  let mockReplicateService: {
    generateImage: ReturnType<typeof vi.fn>;
    getPredictionStatus: ReturnType<typeof vi.fn>;
  };

  const mockExecutionId = new Types.ObjectId().toString();
  const mockNodeId = 'image-node-1';
  const mockPredictionId = 'pred-123';

  const createMockJob = (overrides = {}) => ({
    id: 'job-123',
    data: {
      executionId: mockExecutionId,
      workflowId: 'workflow-123',
      nodeId: mockNodeId,
      nodeType: 'imageGen',
      nodeData: {
        prompt: 'A beautiful sunset',
        aspectRatio: '16:9',
        model: 'flux-pro',
      },
      timestamp: new Date().toISOString(),
    },
    attemptsMade: 0,
    opts: { attempts: 3 },
    updateProgress: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockQueueManager = {
      updateJobStatus: vi.fn().mockResolvedValue(undefined),
      addJobLog: vi.fn().mockResolvedValue(undefined),
      moveToDeadLetterQueue: vi.fn().mockResolvedValue(undefined),
    };

    mockExecutionsService = {
      updateNodeResult: vi.fn().mockResolvedValue(undefined),
    };

    mockReplicateService = {
      generateImage: vi.fn().mockResolvedValue({ id: mockPredictionId }),
      getPredictionStatus: vi.fn().mockResolvedValue({
        status: 'succeeded',
        output: ['https://example.com/image.png'],
        metrics: { predict_time: 5.2 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessor,
        { provide: 'QueueManagerService', useValue: mockQueueManager },
        { provide: 'ExecutionsService', useValue: mockExecutionsService },
        { provide: 'ReplicateService', useValue: mockReplicateService },
      ],
    }).compile();

    processor = module.get<ImageProcessor>(ImageProcessor);
  });

  describe('process', () => {
    it('should update job status to ACTIVE', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith('job-123', JOB_STATUS.ACTIVE);
    });

    it('should update node status to processing', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockExecutionsService.updateNodeResult).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'processing'
      );
    });

    it('should update progress at start', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(job.updateProgress).toHaveBeenCalledWith({
        percent: 10,
        message: 'Starting image generation',
      });
    });

    it('should call Replicate service with correct parameters', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockReplicateService.generateImage).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'flux-pro',
        expect.objectContaining({
          prompt: 'A beautiful sunset',
          aspectRatio: '16:9',
        })
      );
    });

    it('should use default model when not specified', async () => {
      const job = createMockJob({
        data: {
          executionId: mockExecutionId,
          workflowId: 'workflow-123',
          nodeId: mockNodeId,
          nodeType: 'imageGen',
          nodeData: { prompt: 'test' },
          timestamp: new Date().toISOString(),
        },
      });

      await processor.process(job as never);

      expect(mockReplicateService.generateImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'nano-banana', // Default model
        expect.anything()
      );
    });

    it('should add log entry when prediction is created', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.addJobLog).toHaveBeenCalledWith(
        'job-123',
        `Created prediction: ${mockPredictionId}`
      );
    });

    it('should poll for prediction completion', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockReplicateService.getPredictionStatus).toHaveBeenCalledWith(mockPredictionId);
    });

    it('should return success result when prediction succeeds', async () => {
      const job = createMockJob();

      const result = await processor.process(job as never);

      expect(result).toEqual({
        success: true,
        output: ['https://example.com/image.png'],
        predictionId: mockPredictionId,
        predictTime: 5.2,
      });
    });

    it('should update job status to COMPLETED on success', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        JOB_STATUS.COMPLETED,
        expect.objectContaining({
          result: expect.objectContaining({ success: true }),
        })
      );
    });

    it('should return failure result when prediction fails', async () => {
      mockReplicateService.getPredictionStatus.mockResolvedValue({
        status: 'failed',
        error: 'Model error',
      });
      const job = createMockJob();

      const result = await processor.process(job as never);

      expect(result).toEqual({
        success: false,
        error: 'Model error',
        predictionId: mockPredictionId,
      });
    });

    it('should handle canceled predictions', async () => {
      mockReplicateService.getPredictionStatus.mockResolvedValue({
        status: 'canceled',
      });
      const job = createMockJob();

      const result = await processor.process(job as never);

      expect(result).toEqual({
        success: false,
        error: 'Prediction canceled',
        predictionId: mockPredictionId,
      });
    });

    it('should update job status to FAILED on error', async () => {
      mockReplicateService.generateImage.mockRejectedValue(new Error('API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow('API error');

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        JOB_STATUS.FAILED,
        expect.objectContaining({
          error: 'API error',
          attemptsMade: 0,
        })
      );
    });

    it('should update node result to error on failure', async () => {
      mockReplicateService.generateImage.mockRejectedValue(new Error('API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockExecutionsService.updateNodeResult).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'error',
        undefined,
        'API error'
      );
    });

    it('should move to DLQ on last attempt', async () => {
      mockReplicateService.generateImage.mockRejectedValue(new Error('API error'));
      const job = createMockJob({
        attemptsMade: 2, // Last attempt (0-indexed, 3 total)
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).toHaveBeenCalledWith(
        'job-123',
        QUEUE_NAMES.IMAGE_GENERATION,
        'API error'
      );
    });

    it('should not move to DLQ if not last attempt', async () => {
      mockReplicateService.generateImage.mockRejectedValue(new Error('API error'));
      const job = createMockJob({
        attemptsMade: 1, // Not last attempt
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).not.toHaveBeenCalled();
    });
  });

  describe('pollForCompletion', () => {
    it('should update progress during polling', async () => {
      let pollCount = 0;
      mockReplicateService.getPredictionStatus.mockImplementation(() => {
        pollCount++;
        if (pollCount >= 2) {
          return Promise.resolve({
            status: 'succeeded',
            output: ['url'],
            metrics: { predict_time: 1 },
          });
        }
        return Promise.resolve({ status: 'processing' });
      });

      const job = createMockJob();
      await processor.process(job as never);

      // Should have multiple progress updates
      expect(job.updateProgress).toHaveBeenCalledTimes(expect.any(Number));
    });

    it('should timeout after max attempts', async () => {
      // Always return processing status
      mockReplicateService.getPredictionStatus.mockResolvedValue({
        status: 'processing',
      });

      const job = createMockJob();

      // Mock setTimeout to speed up test
      vi.useFakeTimers();

      const processPromise = processor.process(job as never);

      // Fast-forward through all polling intervals
      for (let i = 0; i < 61; i++) {
        await vi.advanceTimersByTimeAsync(5000);
      }

      const result = await processPromise;

      expect(result).toEqual({
        success: false,
        error: 'Prediction timed out',
        predictionId: mockPredictionId,
      });

      vi.useRealTimers();
    }, 10000);
  });

  describe('onCompleted', () => {
    it('should log completion', () => {
      const job = createMockJob();
      expect(() => processor.onCompleted(job as never)).not.toThrow();
    });
  });

  describe('onFailed', () => {
    it('should log failure', () => {
      const job = createMockJob();
      const error = new Error('Test error');
      expect(() => processor.onFailed(job as never, error)).not.toThrow();
    });
  });
});
