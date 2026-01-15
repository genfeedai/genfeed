import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionMongoRepository } from './execution.mongodb';

describe('ExecutionMongoRepository', () => {
  let repository: ExecutionMongoRepository;
  let mockModel: ReturnType<typeof createMockExecutionModel>;
  const testWorkflowId = 'test-workflow-id';

  function createMockExecutionModel() {
    const docs: Record<string, unknown>[] = [];

    const createDoc = (data: Record<string, unknown>) => {
      const now = new Date();
      const doc = {
        _id: data._id ?? `mock-id-${Date.now()}-${Math.random()}`,
        workflowId: data.workflowId ?? '',
        status: data.status ?? 'pending',
        executionMode: data.executionMode ?? 'sync',
        nodeResults: data.nodeResults ?? [],
        queueJobIds: data.queueJobIds ?? [],
        costSummary: data.costSummary ?? {},
        totalCost: data.totalCost ?? 0,
        isDeleted: data.isDeleted ?? false,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
        save: vi.fn().mockImplementation(async () => doc),
      };
      return doc;
    };

    const createQuery = (result: unknown) => ({
      exec: vi.fn().mockResolvedValue(result),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    const model = vi.fn().mockImplementation((data: Record<string, unknown>) => {
      const doc = createDoc(data);
      docs.push(doc);
      return doc;
    });

    (model as Record<string, unknown>).findOne = vi
      .fn()
      .mockImplementation((filter: Record<string, unknown>) => {
        const doc = docs.find((d) => {
          if (filter._id && d._id !== filter._id) return false;
          if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
          return true;
        });
        return createQuery(doc ?? null);
      });

    (model as Record<string, unknown>).find = vi
      .fn()
      .mockImplementation((filter: Record<string, unknown>) => {
        const filtered = docs.filter((d) => {
          if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
          if (filter.workflowId && d.workflowId !== filter.workflowId) return false;
          if (filter.status && d.status !== filter.status) return false;
          return true;
        });
        return createQuery(filtered);
      });

    (model as Record<string, unknown>).findOneAndUpdate = vi
      .fn()
      .mockImplementation(
        (
          filter: Record<string, unknown>,
          update: { $set?: Record<string, unknown> },
          options: { new?: boolean }
        ) => {
          const doc = docs.find((d) => {
            if (filter._id && d._id !== filter._id) return false;
            if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
            return true;
          });
          if (doc && update.$set) {
            Object.assign(doc, update.$set, { updatedAt: new Date() });
          }
          return createQuery(options?.new ? doc : null);
        }
      );

    (model as Record<string, unknown>).deleteOne = vi
      .fn()
      .mockImplementation((filter: Record<string, unknown>) => {
        const index = docs.findIndex((d) => d._id === filter._id);
        const deleted = index >= 0;
        if (deleted) docs.splice(index, 1);
        return { exec: vi.fn().mockResolvedValue({ deletedCount: deleted ? 1 : 0 }) };
      });

    (model as Record<string, unknown>).countDocuments = vi
      .fn()
      .mockImplementation((filter: Record<string, unknown>) => {
        const count = docs.filter((d) => {
          if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
          return true;
        }).length;
        return { exec: vi.fn().mockResolvedValue(count) };
      });

    return Object.assign(model, {
      _docs: docs,
      _reset: () => {
        docs.length = 0;
        vi.clearAllMocks();
      },
    });
  }

  beforeEach(() => {
    mockModel = createMockExecutionModel();
    repository = new ExecutionMongoRepository(mockModel as never);
  });

  describe('create', () => {
    it('should create an execution', async () => {
      const result = await repository.create({ workflowId: testWorkflowId });

      expect(result.id).toBeDefined();
      expect(result.workflowId).toBe(testWorkflowId);
      expect(result.status).toBe('pending');
    });

    it('should set default values', async () => {
      const result = await repository.create({ workflowId: testWorkflowId });

      expect(result.nodeResults).toEqual([]);
      expect(result.queueJobIds).toEqual([]);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return execution by ID', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result!.workflowId).toBe(testWorkflowId);
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all executions', async () => {
      await repository.create({ workflowId: testWorkflowId });
      await repository.create({ workflowId: testWorkflowId });

      const results = await repository.findAll();

      expect(results).toHaveLength(2);
    });
  });

  describe('findByWorkflowId', () => {
    it('should find executions by workflow ID', async () => {
      await repository.create({ workflowId: testWorkflowId });
      await repository.create({ workflowId: 'other-workflow' });

      const results = await repository.findByWorkflowId(testWorkflowId);

      expect(results).toHaveLength(1);
    });
  });

  describe('findByStatus', () => {
    it('should find executions by status', async () => {
      const exec = await repository.create({ workflowId: testWorkflowId });
      await repository.updateStatus(exec.id, 'running');
      await repository.create({ workflowId: testWorkflowId });

      const results = await repository.findByStatus('running');

      expect(results).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update execution', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.update(created.id, { status: 'running' });

      expect(result!.status).toBe('running');
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.updateStatus(created.id, 'completed');

      expect(result!.status).toBe('completed');
    });

    it('should update status with error', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.updateStatus(created.id, 'failed', 'Test error');

      expect(result!.status).toBe('failed');
      expect(result!.error).toBe('Test error');
    });
  });

  describe('updateNodeResult', () => {
    it('should add node result', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.updateNodeResult(created.id, {
        nodeId: 'node-1',
        status: 'completed',
      });

      expect(result!.nodeResults).toHaveLength(1);
    });

    it('should update existing node result', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });
      await repository.updateNodeResult(created.id, { nodeId: 'node-1', status: 'running' });

      const result = await repository.updateNodeResult(created.id, {
        nodeId: 'node-1',
        status: 'completed',
      });

      expect(result!.nodeResults).toHaveLength(1);
      expect(result!.nodeResults[0].status).toBe('completed');
    });
  });

  describe('updateCostSummary', () => {
    it('should update cost summary', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.updateCostSummary(created.id, {
        estimated: 0.5,
        actual: 0.45,
      });

      expect(result!.costSummary).toEqual({ estimated: 0.5, actual: 0.45 });
    });
  });

  describe('softDelete', () => {
    it('should mark as deleted', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.softDelete(created.id);

      expect(result).not.toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete', async () => {
      const created = await repository.create({ workflowId: testWorkflowId });

      const result = await repository.hardDelete(created.id);

      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return count', async () => {
      await repository.create({ workflowId: testWorkflowId });
      await repository.create({ workflowId: testWorkflowId });

      const count = await repository.count();

      expect(count).toBe(2);
    });
  });
});
