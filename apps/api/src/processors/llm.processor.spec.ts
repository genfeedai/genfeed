import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LLMProcessor } from '@/processors/llm.processor';
import { JOB_STATUS, QUEUE_NAMES } from '@/queue/queue.constants';

// Mock BullMQ WorkerHost
vi.mock('@nestjs/bullmq', () => ({
  Processor: () => vi.fn(),
  WorkerHost: class {},
  OnWorkerEvent: () => vi.fn(),
}));

describe('LLMProcessor', () => {
  let processor: LLMProcessor;
  let mockQueueManager: {
    updateJobStatus: ReturnType<typeof vi.fn>;
    addJobLog: ReturnType<typeof vi.fn>;
    moveToDeadLetterQueue: ReturnType<typeof vi.fn>;
  };
  let mockExecutionsService: {
    updateNodeResult: ReturnType<typeof vi.fn>;
  };
  let mockReplicateService: {
    generateText: ReturnType<typeof vi.fn>;
  };

  const mockExecutionId = new Types.ObjectId().toString();
  const mockNodeId = 'llm-node-1';

  const createMockJob = (overrides = {}) => ({
    id: 'llm-job-123',
    data: {
      executionId: mockExecutionId,
      workflowId: 'workflow-123',
      nodeId: mockNodeId,
      nodeType: 'llm',
      nodeData: {
        prompt: 'Write a creative story about AI',
        systemPrompt: 'You are a creative writer',
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
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
      generateText: vi.fn().mockResolvedValue('Once upon a time in a digital world...'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMProcessor,
        { provide: 'QueueManagerService', useValue: mockQueueManager },
        { provide: 'ExecutionsService', useValue: mockExecutionsService },
        { provide: 'ReplicateService', useValue: mockReplicateService },
      ],
    }).compile();

    processor = module.get<LLMProcessor>(LLMProcessor);
  });

  describe('process', () => {
    it('should update job status to ACTIVE', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'llm-job-123',
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
        percent: 20,
        message: 'Starting LLM generation',
      });
    });

    it('should call Replicate service with correct parameters', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockReplicateService.generateText).toHaveBeenCalledWith({
        prompt: 'Write a creative story about AI',
        systemPrompt: 'You are a creative writer',
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      });
    });

    it('should pass all LLM parameters', async () => {
      const job = createMockJob({
        data: {
          executionId: mockExecutionId,
          workflowId: 'workflow-123',
          nodeId: mockNodeId,
          nodeType: 'llm',
          nodeData: {
            prompt: 'Test prompt',
            systemPrompt: 'Test system',
            maxTokens: 500,
            temperature: 0.5,
            topP: 0.8,
          },
          timestamp: new Date().toISOString(),
        },
      });

      await processor.process(job as never);

      expect(mockReplicateService.generateText).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        systemPrompt: 'Test system',
        maxTokens: 500,
        temperature: 0.5,
        topP: 0.8,
      });
    });

    it('should handle minimal parameters', async () => {
      const job = createMockJob({
        data: {
          executionId: mockExecutionId,
          workflowId: 'workflow-123',
          nodeId: mockNodeId,
          nodeType: 'llm',
          nodeData: {
            prompt: 'Simple prompt',
          },
          timestamp: new Date().toISOString(),
        },
      });

      await processor.process(job as never);

      expect(mockReplicateService.generateText).toHaveBeenCalledWith({
        prompt: 'Simple prompt',
        systemPrompt: undefined,
        maxTokens: undefined,
        temperature: undefined,
        topP: undefined,
      });
    });

    it('should update progress after text generation', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(job.updateProgress).toHaveBeenCalledWith({
        percent: 90,
        message: 'Text generated',
      });
    });

    it('should return success result with generated text', async () => {
      const job = createMockJob();

      const result = await processor.process(job as never);

      expect(result).toEqual({
        success: true,
        output: { text: 'Once upon a time in a digital world...' },
      });
    });

    it('should update node result with generated text', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockExecutionsService.updateNodeResult).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'complete',
        { text: 'Once upon a time in a digital world...' }
      );
    });

    it('should update job status to COMPLETED on success', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'llm-job-123',
        JOB_STATUS.COMPLETED,
        expect.objectContaining({
          result: expect.objectContaining({ success: true }),
        })
      );
    });

    it('should update progress to 100% on completion', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(job.updateProgress).toHaveBeenCalledWith({
        percent: 100,
        message: 'Completed',
      });
    });

    it('should add completion log entry', async () => {
      const job = createMockJob();

      await processor.process(job as never);

      expect(mockQueueManager.addJobLog).toHaveBeenCalledWith(
        'llm-job-123',
        'LLM generation completed'
      );
    });

    it('should update job status to FAILED on error', async () => {
      mockReplicateService.generateText.mockRejectedValue(new Error('LLM API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow('LLM API error');

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'llm-job-123',
        JOB_STATUS.FAILED,
        expect.objectContaining({
          error: 'LLM API error',
          attemptsMade: 0,
        })
      );
    });

    it('should update node result to error on failure', async () => {
      mockReplicateService.generateText.mockRejectedValue(new Error('LLM API error'));
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockExecutionsService.updateNodeResult).toHaveBeenCalledWith(
        mockExecutionId,
        mockNodeId,
        'error',
        undefined,
        'LLM API error'
      );
    });

    it('should move to DLQ on last attempt', async () => {
      mockReplicateService.generateText.mockRejectedValue(new Error('LLM API error'));
      const job = createMockJob({
        attemptsMade: 2,
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).toHaveBeenCalledWith(
        'llm-job-123',
        QUEUE_NAMES.LLM_GENERATION,
        'LLM API error'
      );
    });

    it('should not move to DLQ if not last attempt', async () => {
      mockReplicateService.generateText.mockRejectedValue(new Error('LLM API error'));
      const job = createMockJob({
        attemptsMade: 1,
        opts: { attempts: 3 },
      });

      await expect(processor.process(job as never)).rejects.toThrow();

      expect(mockQueueManager.moveToDeadLetterQueue).not.toHaveBeenCalled();
    });

    it('should handle unknown error types', async () => {
      mockReplicateService.generateText.mockRejectedValue('String error');
      const job = createMockJob();

      await expect(processor.process(job as never)).rejects.toBe('String error');

      expect(mockQueueManager.updateJobStatus).toHaveBeenCalledWith(
        'llm-job-123',
        JOB_STATUS.FAILED,
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
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
