import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Workflow } from './schemas/workflow.schema';
import { WorkflowsService } from './workflows.service';

describe('WorkflowsService', () => {
  let service: WorkflowsService;

  const mockWorkflowId = new Types.ObjectId();

  const mockWorkflow = {
    _id: mockWorkflowId,
    name: 'Test Workflow',
    description: 'A test workflow',
    nodes: [
      { id: 'node-1', type: 'promptNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'node-2', type: 'imageGenNode', position: { x: 200, y: 0 }, data: {} },
    ],
    edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
    edgeStyle: 'bezier',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockImplementation(function (this: typeof mockWorkflow) {
      return Promise.resolve(this);
    }),
  };

  const mockWorkflowModel = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockWorkflow]),
    }),
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockWorkflow),
    }),
    findOneAndUpdate: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockWorkflow),
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: getModelToken(Workflow.name), useValue: mockWorkflowModel },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      const saveMock = vi.fn().mockResolvedValue(mockWorkflow);
      const mockModel = Object.assign(
        vi.fn().mockImplementation(() => ({
          ...mockWorkflow,
          save: saveMock,
        })),
        mockWorkflowModel
      );

      const testModule = await Test.createTestingModule({
        providers: [
          WorkflowsService,
          { provide: getModelToken(Workflow.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<WorkflowsService>(WorkflowsService);
      const result = await testService.create({
        name: 'New Workflow',
        description: 'A new workflow',
      });

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();
    });

    it('should create workflow with default nodes and edges', async () => {
      const saveMock = vi.fn().mockResolvedValue(mockWorkflow);
      const mockModel = Object.assign(
        vi.fn().mockImplementation(() => ({
          ...mockWorkflow,
          save: saveMock,
        })),
        mockWorkflowModel
      );

      const testModule = await Test.createTestingModule({
        providers: [
          WorkflowsService,
          { provide: getModelToken(Workflow.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<WorkflowsService>(WorkflowsService);
      const result = await testService.create({
        name: 'Empty Workflow',
      });

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted workflows', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockWorkflow]);
      expect(mockWorkflowModel.find).toHaveBeenCalledWith({ isDeleted: false });
    });

    it('should sort workflows by updatedAt descending', async () => {
      await service.findAll();

      expect(mockWorkflowModel.find().sort).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  describe('findOne', () => {
    it('should return a single workflow by ID', async () => {
      const result = await service.findOne(mockWorkflowId.toString());

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowModel.findOne).toHaveBeenCalledWith({
        _id: mockWorkflowId.toString(),
        isDeleted: false,
      });
    });

    it('should throw NotFoundException when workflow not found', async () => {
      mockWorkflowModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update workflow name', async () => {
      const updatedWorkflow = { ...mockWorkflow, name: 'Updated Workflow' };
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedWorkflow),
      });

      const result = await service.update(mockWorkflowId.toString(), { name: 'Updated Workflow' });

      expect(result.name).toBe('Updated Workflow');
      expect(mockWorkflowModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockWorkflowId.toString(), isDeleted: false },
        { $set: { name: 'Updated Workflow' } },
        { new: true }
      );
    });

    it('should update workflow nodes', async () => {
      const newNodes = [{ id: 'node-3', type: 'outputNode', position: { x: 400, y: 0 }, data: {} }];
      const updatedWorkflow = { ...mockWorkflow, nodes: newNodes };
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedWorkflow),
      });

      const result = await service.update(mockWorkflowId.toString(), { nodes: newNodes });

      expect(result.nodes).toEqual(newNodes);
    });

    it('should update workflow edges', async () => {
      const newEdges = [{ id: 'edge-2', source: 'node-1', target: 'node-3' }];
      const updatedWorkflow = { ...mockWorkflow, edges: newEdges };
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedWorkflow),
      });

      const result = await service.update(mockWorkflowId.toString(), { edges: newEdges });

      expect(result.edges).toEqual(newEdges);
    });

    it('should throw NotFoundException when workflow not found', async () => {
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent-id', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete workflow by setting isDeleted to true', async () => {
      const deletedWorkflow = { ...mockWorkflow, isDeleted: true };
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(deletedWorkflow),
      });

      const result = await service.remove(mockWorkflowId.toString());

      expect(result.isDeleted).toBe(true);
      expect(mockWorkflowModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockWorkflowId.toString(), isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );
    });

    it('should throw NotFoundException when workflow not found', async () => {
      mockWorkflowModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('duplicate', () => {
    it('should create a copy of the workflow', async () => {
      const duplicatedWorkflow = {
        ...mockWorkflow,
        _id: new Types.ObjectId(),
        name: 'Test Workflow (Copy)',
      };
      const saveMock = vi.fn().mockResolvedValue(duplicatedWorkflow);
      const mockModel = Object.assign(
        vi.fn().mockImplementation(() => ({
          ...duplicatedWorkflow,
          save: saveMock,
        })),
        {
          find: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([mockWorkflow]),
          }),
          findOne: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockWorkflow),
          }),
          findOneAndUpdate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockWorkflow),
          }),
        }
      );

      const testModule = await Test.createTestingModule({
        providers: [
          WorkflowsService,
          { provide: getModelToken(Workflow.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<WorkflowsService>(WorkflowsService);
      const result = await testService.duplicate(mockWorkflowId.toString());

      expect(result).toBeDefined();
      expect(result.name).toContain('(Copy)');
    });
  });
});
