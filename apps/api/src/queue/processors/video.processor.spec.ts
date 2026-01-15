import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JOB_STATUS, QUEUE_NAMES } from '../queue.constants';
import { VideoProcessor } from './video.processor';

// Mock BullMQ WorkerHost
vi.mock('@nestjs/bullmq', () => ({
  Processor: () => vi.fn(),
  WorkerHost: class {},
  OnWorkerEvent: () => vi.fn(),
}));

describe('VideoProcessor', () => {
  let processor: VideoProcessor;
  let mockQueueManager: {
    updateJobStatus: ReturnType<typeof vi.fn>;
    addJobLog: ReturnType<typeof vi.fn>;
    moveToDeadLetterQueue: ReturnType<typeof vi.fn>;
  };
  let mockExecutionsService: {
    updateNodeResult: ReturnType<typeof vi.fn>;
  };
  let mockReplicateService: {
    generateVideo: ReturnType<typeof vi.fn>;
    getPredictionStatus: ReturnType<typeof vi.fn>;
  };

  const mockExecutionId = new Types.ObjectId().toString();
  const mockNodeId = 'video-node-1';
  const mockPredictionId = 'pred-video-123';

  const createMockJob = (overrides = {}) => ({
    id: 'video-job-123',
    data: {
      executionId: mockExecutionId,
      workflowId: 'workflow-123',
      nodeId: mockNodeId,
      nodeType: 'videoGen',
      nodeData: {
        prompt: 'A cinematic video of waves',
        duration: 5,
        aspectRatio: '16:9',
        model: 'veo-3.1-turbo',
        generateAudio: true,
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
      generateVideo: vi.fn().mockResolvedValue({ id: mockPredictionId }),
      getPredictionStatus: vi.fn().mockResolvedValue({
        status: 'succeeded',
        output: ['https://example.com/video.mp4'],
        metrics: { predict_time: 120.5 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoProcessor,
        { provide: 'QueueManagerService', useValue: mockQueueManager },
        { provide: 'ExecutionsService', useValue: mockExecutionsService },
        { provide: 'ReplicateService', useValue: mockReplicateService },
      ],
    }).compile();

    processor = module.get<VideoProcessor>(VideoProcessor);
  });

  describe('process', () => {
    it('should update job status to ACTIVE', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'video-job-123',
        JOB_STATUS.ACTIVE
      );
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
        percent: 5,
        message: 'Starting video generation',
      });
    });

    it('should call Replicate service with correct parameters', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockReplicateService.generateVideo).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'veo-3.1-turbo',
        expect.objectContaining({
          prompt: 'A cinematic video of waves',
          duration: 5,
          aspectRatio: '16:9',
          generateAudio: true,
        })
      );
    });

    it('should use default model when not specified', async () => {
      const job = createMockJob({
        data: {
          executionId: mockExecutionId,
          workflowId: 'workflow-123',
          nodeId: mockNodeId,
          nodeType: 'videoGen',
          nodeData: { prompt: 'test video' },
          timestamp: new Date().toISOString(),
        },
      });

      await processor.process(job as never);

      expect(mockReplicateService.generateVideo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'veo-3.1-fast', // Default model
        expect.anything()
      );
    });

    it('should pass all video-specific parameters', async () => {
      const job = createMockJob({
        data: {
          executionId: mockExecutionId,
          workflowId: 'workflow-123',
          nodeId: mockNodeId,
          nodeType: 'videoGen',
          nodeData: {
            prompt: 'test',
            image: 'https://example.com/start.jpg',
            lastFrame: 'https://example.com/end.jpg',
            referenceImages: ['https://example.com/ref1.jpg'],
            negativePrompt: 'blur, distortion',
            seed: 12345,
            resolution: '1080p',
          },
          timestamp: new Date().toISOString(),
        },
      });

      await processor.process(job as never);

      expect(mockReplicateService.generateVideo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          image: 'https://example.com/start.jpg',
          lastFrame: 'https://example.com/end.jpg',
          referenceImages: ['https://example.com/ref1.jpg'],
          negativePrompt: 'blur, distortion',
          seed: 12345,
          resolution: '1080p',
        })
      );
    });

    it('should add log entry when prediction is created', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.addJobLog).toHaveBeenCalledWith(
        'video-job-123',
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
        output: ['https://example.com/video.mp4'],
        predictionId: mockPredictionId,
        predictTime: 120.5,
      });
    });

    it('should update job status to COMPLETED on success', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'video-job-123',
        JOB_STATUS.COMPLETED,
        expect.objectContaining({
          result: expect.objectContaining({ success: true }),
        })
      );
    });

    it('should add completion log entry', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.addJobLog).toHaveBeenCalledWith(
        'video-job-123',
        'Video generation completed'
      );
    });

    it('should return failure result when prediction fails', async () => {
      mockReplicateService.getPredictionStatus.mockResolvedValue({
        status: 'failed',
        error: 'Video generation failed',
      });
      const job = createMockJob();

      const result = await processor.process(job as never);

      expect(result).toEqual({
        success: false,
        error: 'Video generation failed',
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
      mockReplicateService.generateVideo.mockRejectedValue(new Error('Video API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow('Video API error');

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'video-job-123',
        JOB_STATUS.FAILED,
        expect.objectContaining({
          error: 'Video API error',
          attemptsMade: 0,
        })
      );
    });

    it('should update node result to error on failure', async () => {
      mockReplicateService.generateVideo.mockRejectedValue(new Error('Video API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockExecutionsService.updateNodeResult).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'error',
        undefined,
        'Video API error'
      );
    });

    it('should move to DLQ on last attempt', async () => {
      mockReplicateService.generateVideo.mockRejectedValue(new Error('Video API error'));
      const job = createMockJob({
        attemptsMade: 2,
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).toHaveBeenCalledWith(
        'video-job-123',
        QUEUE_NAMES.VIDEO_GENERATION,
        'Video API error'
      );
    });

    it('should not move to DLQ if not last attempt', async () => {
      mockReplicateService.generateVideo.mockRejectedValue(new Error('Video API error'));
      const job = createMockJob({
        attemptsMade: 0,
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).not.toHaveBeenCalled();
    });
  });

  describe('pollForCompletion', () => {
    it('should use longer poll interval for video', async () => {
      let pollCount = 0;
      mockReplicateService.getPredictionStatus.mockImplementation(() => {
        pollCount++;
        if (pollCount >= 2) {
          return Promise.resolve({
            status: 'succeeded',
            output: ['url'],
            metrics: { predict_time: 60 },
          });
        }
        return Promise.resolve({ status: 'processing' });
      });

      const job = createMockJob();
      await processor.process(job as never);

      expect(mockReplicateService.getPredictionStatus).toHaveBeenCalledTimes(2);
    });

    it('should timeout after max attempts with video-specific timeout message', async () => {
      mockReplicateService.getPredictionStatus.mockResolvedValue({
        status: 'processing',
      });

      const job = createMockJob();

      vi.useFakeTimers();

      const processPromise = processor.process(job as never);

      // Fast-forward through all polling intervals (120 attempts * 10s)
      for (let i = 0; i < 121; i++) {
        await vi.advanceTimersByTimeAsync(10000);
      }

      const result = await processPromise;

      expect(result).toEqual({
        success: false,
        error: 'Video prediction timed out',
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
