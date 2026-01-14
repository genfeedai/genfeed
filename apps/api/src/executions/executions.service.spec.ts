import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionsService } from './executions.service';
import { Execution } from './schemas/execution.schema';
import { Job } from './schemas/job.schema';

describe('ExecutionsService', () => {
  let service: ExecutionsService;

  const mockWorkflowId = new Types.ObjectId();
  const mockExecutionId = new Types.ObjectId();
  const mockJobId = new Types.ObjectId();

  const mockExecution = {
    _id: mockExecutionId,
    workflowId: mockWorkflowId,
    status: 'pending',
    startedAt: new Date(),
    completedAt: null,
    totalCost: 0,
    nodeResults: [],
    error: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockImplementation(function (this: typeof mockExecution) {
      return Promise.resolve(this);
    }),
  };

  const mockJob = {
    _id: mockJobId,
    executionId: mockExecutionId,
    nodeId: 'node-1',
    predictionId: 'prediction-123',
    status: 'pending',
    progress: 0,
    output: null,
    error: null,
    cost: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockImplementation(function (this: typeof mockJob) {
      return Promise.resolve(this);
    }),
  };

  const mockExecutionModel = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockExecution]),
    }),
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockExecution),
    }),
    findByIdAndUpdate: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockExecution),
    }),
  };

  const mockJobModel = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockJob]),
    }),
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockJob),
    }),
    findOneAndUpdate: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockJob),
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockExecution.save.mockImplementation(function (this: typeof mockExecution) {
      return Promise.resolve(this);
    });
    mockJob.save.mockImplementation(function (this: typeof mockJob) {
      return Promise.resolve(this);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionsService,
        { provide: getModelToken(Execution.name), useValue: mockExecutionModel },
        { provide: getModelToken(Job.name), useValue: mockJobModel },
      ],
    }).compile();

    service = module.get<ExecutionsService>(ExecutionsService);
  });

  describe('createExecution', () => {
    it('should create a new execution with pending status', async () => {
      // Mock the model constructor
      const saveMock = vi.fn().mockResolvedValue(mockExecution);
      const mockModel = vi.fn().mockImplementation(() => ({
        ...mockExecution,
        save: saveMock,
      }));
      mockModel.find = mockExecutionModel.find;
      mockModel.findOne = mockExecutionModel.findOne;
      mockModel.findByIdAndUpdate = mockExecutionModel.findByIdAndUpdate;

      const testModule = await Test.createTestingModule({
        providers: [
          ExecutionsService,
          { provide: getModelToken(Execution.name), useValue: mockModel },
          { provide: getModelToken(Job.name), useValue: mockJobModel },
        ],
      }).compile();

      const testService = testModule.get<ExecutionsService>(ExecutionsService);
      const result = await testService.createExecution(mockWorkflowId.toString());

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findExecutionsByWorkflow', () => {
    it('should return executions for a workflow', async () => {
      const result = await service.findExecutionsByWorkflow(mockWorkflowId.toString());

      expect(result).toEqual([mockExecution]);
      expect(mockExecutionModel.find).toHaveBeenCalledWith({
        workflowId: expect.any(Types.ObjectId),
        isDeleted: false,
      });
    });

    it('should sort executions by createdAt descending', async () => {
      await service.findExecutionsByWorkflow(mockWorkflowId.toString());

      expect(mockExecutionModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findExecution', () => {
    it('should return a single execution by ID', async () => {
      const result = await service.findExecution(mockExecutionId.toString());

      expect(result).toEqual(mockExecution);
      expect(mockExecutionModel.findOne).toHaveBeenCalledWith({
        _id: mockExecutionId.toString(),
        isDeleted: false,
      });
    });

    it('should throw NotFoundException when execution not found', async () => {
      mockExecutionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findExecution('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExecutionStatus', () => {
    it('should update execution status', async () => {
      const result = await service.updateExecutionStatus(mockExecutionId.toString(), 'running');

      expect(result).toBeDefined();
      expect(mockExecutionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExecutionId.toString(),
        { $set: { status: 'running' } },
        { new: true }
      );
    });

    it('should set completedAt when status is completed', async () => {
      await service.updateExecutionStatus(mockExecutionId.toString(), 'completed');

      expect(mockExecutionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExecutionId.toString(),
        { $set: expect.objectContaining({ status: 'completed', completedAt: expect.any(Date) }) },
        { new: true }
      );
    });

    it('should set completedAt when status is failed', async () => {
      await service.updateExecutionStatus(mockExecutionId.toString(), 'failed', 'Error message');

      expect(mockExecutionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExecutionId.toString(),
        {
          $set: expect.objectContaining({
            status: 'failed',
            completedAt: expect.any(Date),
            error: 'Error message',
          }),
        },
        { new: true }
      );
    });

    it('should set completedAt when status is cancelled', async () => {
      await service.updateExecutionStatus(mockExecutionId.toString(), 'cancelled');

      expect(mockExecutionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExecutionId.toString(),
        { $set: expect.objectContaining({ status: 'cancelled', completedAt: expect.any(Date) }) },
        { new: true }
      );
    });

    it('should throw NotFoundException when execution not found', async () => {
      mockExecutionModel.findByIdAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.updateExecutionStatus('nonexistent-id', 'running')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateNodeResult', () => {
    it('should add a new node result', async () => {
      const executionWithResults = {
        ...mockExecution,
        nodeResults: [],
        save: vi.fn().mockImplementation(function (this: typeof executionWithResults) {
          return Promise.resolve(this);
        }),
      };

      mockExecutionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(executionWithResults),
      });

      const result = await service.updateNodeResult(
        mockExecutionId.toString(),
        'node-1',
        'processing'
      );

      expect(result).toBeDefined();
      expect(executionWithResults.save).toHaveBeenCalled();
    });

    it('should update an existing node result', async () => {
      const executionWithResults = {
        ...mockExecution,
        nodeResults: [
          {
            nodeId: 'node-1',
            status: 'processing',
            output: null,
            error: null,
            cost: 0,
          },
        ],
        save: vi.fn().mockImplementation(function (this: typeof executionWithResults) {
          return Promise.resolve(this);
        }),
      };

      mockExecutionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(executionWithResults),
      });

      const result = await service.updateNodeResult(
        mockExecutionId.toString(),
        'node-1',
        'complete',
        { url: 'https://example.com/output.png' },
        undefined,
        0.05
      );

      expect(result).toBeDefined();
      expect(executionWithResults.save).toHaveBeenCalled();
    });

    it('should calculate total cost from node results', async () => {
      const executionWithResults = {
        ...mockExecution,
        totalCost: 0,
        nodeResults: [
          { nodeId: 'node-1', status: 'complete', cost: 0.02 },
          { nodeId: 'node-2', status: 'complete', cost: 0.03 },
        ],
        save: vi.fn().mockImplementation(function (this: typeof executionWithResults) {
          return Promise.resolve(this);
        }),
      };

      mockExecutionModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(executionWithResults),
      });

      const result = await service.updateNodeResult(
        mockExecutionId.toString(),
        'node-3',
        'complete',
        {},
        undefined,
        0.05
      );

      expect(result.totalCost).toBe(0.1); // 0.02 + 0.03 + 0.05
    });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const saveMock = vi.fn().mockResolvedValue(mockJob);
      const mockModel = vi.fn().mockImplementation(() => ({
        ...mockJob,
        save: saveMock,
      }));
      mockModel.find = mockJobModel.find;
      mockModel.findOne = mockJobModel.findOne;
      mockModel.findOneAndUpdate = mockJobModel.findOneAndUpdate;

      const testModule = await Test.createTestingModule({
        providers: [
          ExecutionsService,
          { provide: getModelToken(Execution.name), useValue: mockExecutionModel },
          { provide: getModelToken(Job.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<ExecutionsService>(ExecutionsService);
      const result = await testService.createJob(
        mockExecutionId.toString(),
        'node-1',
        'prediction-123'
      );

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findJobByPredictionId', () => {
    it('should return job by prediction ID', async () => {
      const result = await service.findJobByPredictionId('prediction-123');

      expect(result).toEqual(mockJob);
      expect(mockJobModel.findOne).toHaveBeenCalledWith({ predictionId: 'prediction-123' });
    });

    it('should return null when job not found', async () => {
      mockJobModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await service.findJobByPredictionId('nonexistent-prediction');

      expect(result).toBeNull();
    });
  });

  describe('updateJob', () => {
    it('should update job status', async () => {
      const result = await service.updateJob('prediction-123', { status: 'succeeded' });

      expect(result).toBeDefined();
      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { predictionId: 'prediction-123' },
        { $set: { status: 'succeeded' } },
        { new: true }
      );
    });

    it('should update job with output and cost', async () => {
      await service.updateJob('prediction-123', {
        status: 'succeeded',
        output: { url: 'https://example.com/output.png' },
        cost: 0.05,
      });

      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { predictionId: 'prediction-123' },
        {
          $set: {
            status: 'succeeded',
            output: { url: 'https://example.com/output.png' },
            cost: 0.05,
          },
        },
        { new: true }
      );
    });

    it('should update job with error', async () => {
      await service.updateJob('prediction-123', {
        status: 'failed',
        error: 'Model crashed',
      });

      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { predictionId: 'prediction-123' },
        { $set: { status: 'failed', error: 'Model crashed' } },
        { new: true }
      );
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateJob('nonexistent-prediction', { status: 'succeeded' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findJobsByExecution', () => {
    it('should return jobs for an execution', async () => {
      const result = await service.findJobsByExecution(mockExecutionId.toString());

      expect(result).toEqual([mockJob]);
      expect(mockJobModel.find).toHaveBeenCalledWith({
        executionId: expect.any(Types.ObjectId),
      });
    });

    it('should sort jobs by createdAt ascending', async () => {
      await service.findJobsByExecution(mockExecutionId.toString());

      expect(mockJobModel.find().sort).toHaveBeenCalledWith({ createdAt: 1 });
    });
  });
});
