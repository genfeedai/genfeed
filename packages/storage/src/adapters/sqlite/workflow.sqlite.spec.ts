import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorkflowSqliteRepository } from './workflow.sqlite';

describe('WorkflowSqliteRepository', () => {
  let db: Database.Database;
  let repository: WorkflowSqliteRepository;

  const createTestWorkflow = async (name = 'Test Workflow') => {
    return repository.create({
      name,
      description: 'A test workflow',
      nodes: [{ id: 'node-1', type: 'prompt', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      edgeStyle: 'bezier',
      groups: [],
    });
  };

  beforeEach(() => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create workflows table
    db.exec(`
      CREATE TABLE workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        version INTEGER DEFAULT 1,
        nodes TEXT DEFAULT '[]',
        edges TEXT DEFAULT '[]',
        edge_style TEXT DEFAULT 'smoothstep',
        groups TEXT DEFAULT '[]',
        is_deleted INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    repository = new WorkflowSqliteRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      const workflow = await createTestWorkflow();

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.description).toBe('A test workflow');
      expect(workflow.nodes).toHaveLength(1);
      expect(workflow.edges).toHaveLength(0);
      expect(workflow.edgeStyle).toBe('bezier');
      expect(workflow.isDeleted).toBe(false);
    });

    it('should use default values when not provided', async () => {
      const workflow = await repository.create({ name: 'Minimal Workflow' });

      expect(workflow.description).toBe('');
      expect(workflow.nodes).toEqual([]);
      expect(workflow.edges).toEqual([]);
      expect(workflow.edgeStyle).toBe('smoothstep');
    });

    it('should generate unique IDs', async () => {
      const workflow1 = await createTestWorkflow('Workflow 1');
      const workflow2 = await createTestWorkflow('Workflow 2');

      expect(workflow1.id).not.toBe(workflow2.id);
    });
  });

  describe('findById', () => {
    it('should find workflow by ID', async () => {
      const created = await createTestWorkflow();

      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(created.name);
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should not find soft-deleted workflow', async () => {
      const created = await createTestWorkflow();
      await repository.softDelete(created.id);

      const found = await repository.findById(created.id);

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted workflows', async () => {
      await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');
      await createTestWorkflow('Workflow 3');

      const workflows = await repository.findAll();

      expect(workflows).toHaveLength(3);
    });

    it('should exclude soft-deleted workflows', async () => {
      const workflow1 = await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');
      await repository.softDelete(workflow1.id);

      const workflows = await repository.findAll();

      expect(workflows).toHaveLength(1);
      expect(workflows[0].name).toBe('Workflow 2');
    });

    it('should support limit option', async () => {
      await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');
      await createTestWorkflow('Workflow 3');

      const workflows = await repository.findAll({ limit: 2 });

      expect(workflows).toHaveLength(2);
    });

    it('should support offset option', async () => {
      await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');
      await createTestWorkflow('Workflow 3');

      const workflows = await repository.findAll({ limit: 2, offset: 1 });

      expect(workflows).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update workflow name', async () => {
      const created = await createTestWorkflow();

      const updated = await repository.update(created.id, { name: 'Updated Name' });

      expect(updated?.name).toBe('Updated Name');
    });

    it('should update workflow nodes', async () => {
      const created = await createTestWorkflow();
      const newNodes = [
        { id: 'node-1', type: 'prompt', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', type: 'imageGen', position: { x: 200, y: 0 }, data: {} },
      ];

      const updated = await repository.update(created.id, { nodes: newNodes });

      expect(updated?.nodes).toHaveLength(2);
    });

    it('should return null for non-existent ID', async () => {
      const updated = await repository.update('non-existent-id', { name: 'New Name' });

      expect(updated).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const created = await createTestWorkflow();
      const originalUpdatedAt = created.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { name: 'Updated' });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('softDelete', () => {
    it('should soft delete workflow', async () => {
      const created = await createTestWorkflow();

      const deleted = await repository.softDelete(created.id);

      expect(deleted).not.toBeNull();
      expect(deleted?.id).toBe(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return null for non-existent ID', async () => {
      const deleted = await repository.softDelete('non-existent-id');

      expect(deleted).toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('should hard delete workflow', async () => {
      const created = await createTestWorkflow();

      const result = await repository.hardDelete(created.id);

      expect(result).toBe(true);

      // Check it's really gone (even soft-deleted wouldn't show up)
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should return false for non-existent ID', async () => {
      const result = await repository.hardDelete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('should duplicate workflow with (Copy) suffix', async () => {
      const original = await createTestWorkflow('Original Workflow');

      const duplicate = await repository.duplicate(original.id);

      expect(duplicate.name).toBe('Original Workflow (Copy)');
      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.nodes).toEqual(original.nodes);
      expect(duplicate.edges).toEqual(original.edges);
    });

    it('should throw for non-existent ID', async () => {
      await expect(repository.duplicate('non-existent-id')).rejects.toThrow(
        'Workflow with ID non-existent-id not found'
      );
    });
  });

  describe('search', () => {
    it('should search by name', async () => {
      await createTestWorkflow('Image Generator');
      await createTestWorkflow('Video Pipeline');
      await createTestWorkflow('Text Analysis');

      const results = await repository.search('Image');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Image Generator');
    });

    it('should search by description', async () => {
      const workflow = await repository.create({
        name: 'Workflow',
        description: 'Creates beautiful images',
      });

      const results = await repository.search('beautiful');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(workflow.id);
    });

    it('should return empty array for no matches', async () => {
      await createTestWorkflow('Test Workflow');

      const results = await repository.search('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('should count all non-deleted workflows', async () => {
      await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');

      const count = await repository.count();

      expect(count).toBe(2);
    });

    it('should exclude soft-deleted workflows', async () => {
      const workflow1 = await createTestWorkflow('Workflow 1');
      await createTestWorkflow('Workflow 2');
      await repository.softDelete(workflow1.id);

      const count = await repository.count();

      expect(count).toBe(1);
    });
  });

  describe('findByName', () => {
    it('should find workflow by exact name', async () => {
      await createTestWorkflow('Unique Name');

      const found = await repository.findByName('Unique Name');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Unique Name');
    });

    it('should return null for non-existent name', async () => {
      const found = await repository.findByName('Non-existent');

      expect(found).toBeNull();
    });
  });
});
