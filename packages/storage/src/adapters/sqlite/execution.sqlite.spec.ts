import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestExecutionData,
  createTestNodeResult,
  EXECUTION_SCHEMA,
} from '../../test/test-utils';
import { ExecutionSqliteRepository } from './execution.sqlite';

describe('ExecutionSqliteRepository', () => {
  let db: Database.Database;
  let repository: ExecutionSqliteRepository;
  const testWorkflowId = 'test-workflow-id';

  beforeEach(() => {
    db = createTestDatabase(EXECUTION_SCHEMA);
    repository = new ExecutionSqliteRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create an execution with generated UUID', async () => {
      const data = createTestExecutionData(testWorkflowId);

      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.workflowId).toBe(testWorkflowId);
    });

    it('should set default values', async () => {
      const data = createTestExecutionData(testWorkflowId);

      const result = await repository.create(data);

      expect(result.status).toBe('pending');
      expect(result.totalCost).toBe(0);
      expect(result.costSummary).toEqual({});
      expect(result.nodeResults).toEqual([]);
      expect(result.isDeleted).toBe(false);
      expect(result.queueJobIds).toEqual([]);
    });

    it('should use provided execution mode', async () => {
      const data = createTestExecutionData(testWorkflowId, { executionMode: 'sync' });

      const result = await repository.create(data);

      expect(result.executionMode).toBe('sync');
    });

    it('should default to sync execution mode', async () => {
      const data = { workflowId: testWorkflowId };

      const result = await repository.create(data);

      expect(result.executionMode).toBe('sync');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();
      const data = createTestExecutionData(testWorkflowId);

      const result = await repository.create(data);

      const after = new Date();
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('findById', () => {
    it('should return execution by ID', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.workflowId).toBe(testWorkflowId);
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted executions', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.softDelete(created.id);

      const result = await repository.findById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find execution by workflowId', async () => {
      await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.findOne({ where: { workflowId: testWorkflowId } });

      expect(result).not.toBeNull();
      expect(result!.workflowId).toBe(testWorkflowId);
    });

    it('should find execution by status', async () => {
      const execution = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.updateStatus(execution.id, 'running');

      const result = await repository.findOne({ where: { status: 'running' } });

      expect(result).not.toBeNull();
      expect(result!.status).toBe('running');
    });

    it('should return null if no match', async () => {
      const result = await repository.findOne({ where: { workflowId: 'non-existent' } });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted executions', async () => {
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));

      const results = await repository.findAll();

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no executions exist', async () => {
      const results = await repository.findAll();

      expect(results).toEqual([]);
    });

    it('should order by created_at DESC by default', async () => {
      const first = await repository.create(createTestExecutionData(testWorkflowId));
      await new Promise((r) => setTimeout(r, 10));
      const second = await repository.create(createTestExecutionData(testWorkflowId));

      const results = await repository.findAll();

      expect(results[0].id).toBe(second.id);
      expect(results[1].id).toBe(first.id);
    });

    it('should support limit and offset', async () => {
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));

      const results = await repository.findAll({ limit: 2, offset: 1 });

      expect(results).toHaveLength(2);
    });

    it('should not return soft-deleted executions', async () => {
      const execution = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.softDelete(execution.id);

      const results = await repository.findAll();

      expect(results).toHaveLength(1);
    });
  });

  describe('findByWorkflowId', () => {
    it('should find all executions for a workflow', async () => {
      const otherWorkflowId = 'other-workflow';
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(otherWorkflowId));

      const results = await repository.findByWorkflowId(testWorkflowId);

      expect(results).toHaveLength(2);
      expect(results.every((e) => e.workflowId === testWorkflowId)).toBe(true);
    });

    it('should return empty array for workflow with no executions', async () => {
      const results = await repository.findByWorkflowId('no-executions');

      expect(results).toEqual([]);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(createTestExecutionData(testWorkflowId));
      }

      const results = await repository.findByWorkflowId(testWorkflowId, { limit: 2 });

      expect(results).toHaveLength(2);
    });
  });

  describe('findByStatus', () => {
    it('should find all executions with given status', async () => {
      const exec1 = await repository.create(createTestExecutionData(testWorkflowId));
      const exec2 = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));

      await repository.updateStatus(exec1.id, 'running');
      await repository.updateStatus(exec2.id, 'running');

      const results = await repository.findByStatus('running');

      expect(results).toHaveLength(2);
      expect(results.every((e) => e.status === 'running')).toBe(true);
    });

    it('should return empty array for unused status', async () => {
      await repository.create(createTestExecutionData(testWorkflowId));

      const results = await repository.findByStatus('completed');

      expect(results).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update execution status', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.update(created.id, { status: 'running' });

      expect(result).not.toBeNull();
      expect(result!.status).toBe('running');
    });

    it('should update startedAt', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const startedAt = new Date();

      const result = await repository.update(created.id, { startedAt });

      expect(result!.startedAt).toBeDefined();
      expect(result!.startedAt!.getTime()).toBe(startedAt.getTime());
    });

    it('should update completedAt', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const completedAt = new Date();

      const result = await repository.update(created.id, { completedAt });

      expect(result!.completedAt).toBeDefined();
      expect(result!.completedAt!.getTime()).toBe(completedAt.getTime());
    });

    it('should update totalCost', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.update(created.id, { totalCost: 0.25 });

      expect(result!.totalCost).toBe(0.25);
    });

    it('should update costSummary', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const costSummary = { estimated: 0.2, actual: 0.25, variance: 0.05 };

      const result = await repository.update(created.id, { costSummary });

      expect(result!.costSummary).toEqual(costSummary);
    });

    it('should update nodeResults', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const nodeResults = [createTestNodeResult('node-1', { status: 'completed' })];

      const result = await repository.update(created.id, { nodeResults });

      expect(result!.nodeResults).toHaveLength(1);
      expect(result!.nodeResults[0].nodeId).toBe('node-1');
    });

    it('should update error', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.update(created.id, { error: 'Something went wrong' });

      expect(result!.error).toBe('Something went wrong');
    });

    it('should update queueJobIds', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.update(created.id, { queueJobIds: ['job-1', 'job-2'] });

      expect(result!.queueJobIds).toEqual(['job-1', 'job-2']);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      await new Promise((r) => setTimeout(r, 10));

      const result = await repository.update(created.id, { status: 'running' });

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.update('non-existent', { status: 'running' });

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.updateStatus(created.id, 'running');

      expect(result!.status).toBe('running');
    });

    it('should update status with error', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.updateStatus(created.id, 'failed', 'Network error');

      expect(result!.status).toBe('failed');
      expect(result!.error).toBe('Network error');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.updateStatus('non-existent', 'running');

      expect(result).toBeNull();
    });
  });

  describe('updateNodeResult', () => {
    it('should add new node result', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const nodeResult = createTestNodeResult('node-1', { status: 'completed' });

      const result = await repository.updateNodeResult(created.id, nodeResult);

      expect(result!.nodeResults).toHaveLength(1);
      expect(result!.nodeResults[0].nodeId).toBe('node-1');
      expect(result!.nodeResults[0].status).toBe('completed');
    });

    it('should update existing node result', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.updateNodeResult(
        created.id,
        createTestNodeResult('node-1', { status: 'running' })
      );

      const result = await repository.updateNodeResult(
        created.id,
        createTestNodeResult('node-1', { status: 'completed', output: { url: 'test.jpg' } })
      );

      expect(result!.nodeResults).toHaveLength(1);
      expect(result!.nodeResults[0].status).toBe('completed');
      expect(result!.nodeResults[0].output).toEqual({ url: 'test.jpg' });
    });

    it('should preserve other node results when updating', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.updateNodeResult(
        created.id,
        createTestNodeResult('node-1', { status: 'completed' })
      );
      await repository.updateNodeResult(
        created.id,
        createTestNodeResult('node-2', { status: 'running' })
      );

      const result = await repository.updateNodeResult(
        created.id,
        createTestNodeResult('node-2', { status: 'completed' })
      );

      expect(result!.nodeResults).toHaveLength(2);
      expect(result!.nodeResults.find((r) => r.nodeId === 'node-1')!.status).toBe('completed');
      expect(result!.nodeResults.find((r) => r.nodeId === 'node-2')!.status).toBe('completed');
    });

    it('should return null for non-existent execution', async () => {
      const result = await repository.updateNodeResult(
        'non-existent',
        createTestNodeResult('node-1')
      );

      expect(result).toBeNull();
    });
  });

  describe('updateCostSummary', () => {
    it('should update cost summary', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      const costSummary = { estimated: 0.5, actual: 0.45, variance: -0.05 };

      const result = await repository.updateCostSummary(created.id, costSummary);

      expect(result!.costSummary).toEqual(costSummary);
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.updateCostSummary('non-existent', { estimated: 0.5 });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should mark execution as deleted', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.softDelete(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
    });

    it('should prevent finding deleted execution', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.softDelete(created.id);

      const found = await repository.findById(created.id);

      expect(found).toBeNull();
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.softDelete('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('should permanently remove execution', async () => {
      const created = await repository.create(createTestExecutionData(testWorkflowId));

      const result = await repository.hardDelete(created.id);

      expect(result).toBe(true);
      const row = db.prepare('SELECT * FROM executions WHERE id = ?').get(created.id);
      expect(row).toBeUndefined();
    });

    it('should return false for non-existent ID', async () => {
      const result = await repository.hardDelete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count of non-deleted executions', async () => {
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));

      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should return 0 when no executions exist', async () => {
      const count = await repository.count();

      expect(count).toBe(0);
    });

    it('should filter by where clause', async () => {
      const exec = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.updateStatus(exec.id, 'running');

      const count = await repository.count({ where: { status: 'running' } });

      expect(count).toBe(1);
    });

    it('should not count soft-deleted executions', async () => {
      const execution = await repository.create(createTestExecutionData(testWorkflowId));
      await repository.create(createTestExecutionData(testWorkflowId));
      await repository.softDelete(execution.id);

      const count = await repository.count();

      expect(count).toBe(1);
    });
  });
});
