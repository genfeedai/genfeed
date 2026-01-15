import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestEdge,
  createTestNode,
  createTestTemplateData,
  TEMPLATE_SCHEMA,
} from '../../test/test-utils';
import { TemplateSqliteRepository } from './template.sqlite';

describe('TemplateSqliteRepository', () => {
  let db: Database.Database;
  let repository: TemplateSqliteRepository;

  beforeEach(() => {
    db = createTestDatabase(TEMPLATE_SCHEMA);
    repository = new TemplateSqliteRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a template with generated UUID', async () => {
      const data = createTestTemplateData({ name: 'My Template' });

      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.name).toBe('My Template');
    });

    it('should set default values for optional fields', async () => {
      const data = { name: 'Minimal Template' };

      const result = await repository.create(data);

      expect(result.description).toBe('');
      expect(result.category).toBe('custom');
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.isSystem).toBe(false);
      expect(result.isDeleted).toBe(false);
    });

    it('should serialize nodes and edges as JSON', async () => {
      const node = createTestNode({ type: 'imageGen' });
      const node2 = createTestNode({ type: 'output' });
      const edge = createTestEdge(node.id, node2.id);

      const data = createTestTemplateData({
        nodes: [node, node2],
        edges: [edge],
      });

      const result = await repository.create(data);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
    });

    it('should create system template', async () => {
      const data = createTestTemplateData({ isSystem: true });

      const result = await repository.create(data);

      expect(result.isSystem).toBe(true);
    });

    it('should set thumbnail if provided', async () => {
      const data = createTestTemplateData({ thumbnail: 'https://example.com/thumb.jpg' });

      const result = await repository.create(data);

      expect(result.thumbnail).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('findById', () => {
    it('should return template by ID', async () => {
      const created = await repository.create(createTestTemplateData({ name: 'Find Me' }));

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Find Me');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted templates', async () => {
      const created = await repository.create(createTestTemplateData());
      await repository.softDelete(created.id);

      const result = await repository.findById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find template by name', async () => {
      await repository.create(createTestTemplateData({ name: 'Unique Name' }));

      const result = await repository.findOne({ where: { name: 'Unique Name' } });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Unique Name');
    });

    it('should find template by category', async () => {
      await repository.create(createTestTemplateData({ category: 'video' }));

      const result = await repository.findOne({ where: { category: 'video' } });

      expect(result).not.toBeNull();
      expect(result!.category).toBe('video');
    });

    it('should find template by isSystem flag', async () => {
      await repository.create(createTestTemplateData({ isSystem: true }));
      await repository.create(createTestTemplateData({ isSystem: false }));

      const result = await repository.findOne({ where: { isSystem: true } });

      expect(result).not.toBeNull();
      expect(result!.isSystem).toBe(true);
    });

    it('should return null if no match', async () => {
      const result = await repository.findOne({ where: { name: 'Does Not Exist' } });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted templates', async () => {
      await repository.create(createTestTemplateData({ name: 'Template 1' }));
      await repository.create(createTestTemplateData({ name: 'Template 2' }));
      await repository.create(createTestTemplateData({ name: 'Template 3' }));

      const results = await repository.findAll();

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no templates exist', async () => {
      const results = await repository.findAll();

      expect(results).toEqual([]);
    });

    it('should order by updated_at DESC by default', async () => {
      const first = await repository.create(createTestTemplateData({ name: 'First' }));
      await new Promise((r) => setTimeout(r, 10));
      await repository.create(createTestTemplateData({ name: 'Second' }));
      await new Promise((r) => setTimeout(r, 10));
      await repository.update(first.id, { name: 'First Updated' });

      const results = await repository.findAll();

      expect(results[0].name).toBe('First Updated');
    });

    it('should support custom sorting', async () => {
      await repository.create(createTestTemplateData({ name: 'Zebra' }));
      await repository.create(createTestTemplateData({ name: 'Apple' }));

      const results = await repository.findAll({ sortBy: 'name', sortOrder: 'asc' });

      expect(results[0].name).toBe('Apple');
      expect(results[1].name).toBe('Zebra');
    });

    it('should support limit and offset', async () => {
      await repository.create(createTestTemplateData({ name: 'A' }));
      await repository.create(createTestTemplateData({ name: 'B' }));
      await repository.create(createTestTemplateData({ name: 'C' }));

      const results = await repository.findAll({
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 2,
        offset: 1,
      });

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('B');
    });
  });

  describe('findByCategory', () => {
    it('should find all templates in category', async () => {
      await repository.create(createTestTemplateData({ category: 'image' }));
      await repository.create(createTestTemplateData({ category: 'image' }));
      await repository.create(createTestTemplateData({ category: 'video' }));

      const results = await repository.findByCategory('image');

      expect(results).toHaveLength(2);
      expect(results.every((t) => t.category === 'image')).toBe(true);
    });

    it('should return empty array for category with no templates', async () => {
      const results = await repository.findByCategory('non-existent');

      expect(results).toEqual([]);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(createTestTemplateData({ category: 'test' }));
      }

      const results = await repository.findByCategory('test', { limit: 2 });

      expect(results).toHaveLength(2);
    });
  });

  describe('findSystemTemplates', () => {
    it('should find all system templates', async () => {
      await repository.create(createTestTemplateData({ isSystem: true, name: 'System 1' }));
      await repository.create(createTestTemplateData({ isSystem: true, name: 'System 2' }));
      await repository.create(createTestTemplateData({ isSystem: false, name: 'Custom' }));

      const results = await repository.findSystemTemplates();

      expect(results).toHaveLength(2);
      expect(results.every((t) => t.isSystem)).toBe(true);
    });

    it('should order by name ASC', async () => {
      await repository.create(createTestTemplateData({ isSystem: true, name: 'Zebra' }));
      await repository.create(createTestTemplateData({ isSystem: true, name: 'Apple' }));

      const results = await repository.findSystemTemplates();

      expect(results[0].name).toBe('Apple');
      expect(results[1].name).toBe('Zebra');
    });

    it('should return empty array when no system templates exist', async () => {
      await repository.create(createTestTemplateData({ isSystem: false }));

      const results = await repository.findSystemTemplates();

      expect(results).toEqual([]);
    });
  });

  describe('upsertSystemTemplate', () => {
    it('should create new system template if not exists', async () => {
      const data = createTestTemplateData({ name: 'New System' });

      const result = await repository.upsertSystemTemplate(data);

      expect(result.name).toBe('New System');
      expect(result.isSystem).toBe(true);
    });

    it('should update existing system template by name', async () => {
      await repository.create(
        createTestTemplateData({ name: 'Existing', isSystem: true, description: 'Old' })
      );

      const result = await repository.upsertSystemTemplate({
        name: 'Existing',
        description: 'Updated',
      });

      expect(result.name).toBe('Existing');
      expect(result.description).toBe('Updated');

      const count = await repository.count({ where: { name: 'Existing' } });
      expect(count).toBe(1);
    });

    it('should not affect custom templates with same name', async () => {
      await repository.create(
        createTestTemplateData({ name: 'Same Name', isSystem: false, description: 'Custom' })
      );

      await repository.upsertSystemTemplate({
        name: 'Same Name',
        description: 'System',
      });

      const all = await repository.findAll({ where: { name: 'Same Name' } });
      expect(all).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update template name', async () => {
      const created = await repository.create(createTestTemplateData({ name: 'Original' }));

      const result = await repository.update(created.id, { name: 'Updated' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Updated');
    });

    it('should update template description', async () => {
      const created = await repository.create(createTestTemplateData({ description: 'Old' }));

      const result = await repository.update(created.id, { description: 'New' });

      expect(result!.description).toBe('New');
    });

    it('should update template category', async () => {
      const created = await repository.create(createTestTemplateData({ category: 'old' }));

      const result = await repository.update(created.id, { category: 'new' });

      expect(result!.category).toBe('new');
    });

    it('should update template nodes', async () => {
      const created = await repository.create(createTestTemplateData());
      const newNode = createTestNode({ type: 'llm' });

      const result = await repository.update(created.id, { nodes: [newNode] });

      expect(result!.nodes).toHaveLength(1);
      expect(result!.nodes[0].type).toBe('llm');
    });

    it('should update template edges', async () => {
      const node1 = createTestNode();
      const node2 = createTestNode();
      const created = await repository.create(createTestTemplateData({ nodes: [node1, node2] }));
      const newEdge = createTestEdge(node1.id, node2.id);

      const result = await repository.update(created.id, { edges: [newEdge] });

      expect(result!.edges).toHaveLength(1);
    });

    it('should update thumbnail', async () => {
      const created = await repository.create(createTestTemplateData());

      const result = await repository.update(created.id, {
        thumbnail: 'https://new-thumb.jpg',
      });

      expect(result!.thumbnail).toBe('https://new-thumb.jpg');
    });

    it('should update isSystem flag', async () => {
      const created = await repository.create(createTestTemplateData({ isSystem: false }));

      const result = await repository.update(created.id, { isSystem: true });

      expect(result!.isSystem).toBe(true);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await repository.create(createTestTemplateData());
      await new Promise((r) => setTimeout(r, 10));

      const result = await repository.update(created.id, { name: 'Updated' });

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.update('non-existent', { name: 'New' });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should mark template as deleted', async () => {
      const created = await repository.create(createTestTemplateData());

      const result = await repository.softDelete(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
    });

    it('should prevent finding deleted template', async () => {
      const created = await repository.create(createTestTemplateData());
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
    it('should permanently remove template', async () => {
      const created = await repository.create(createTestTemplateData());

      const result = await repository.hardDelete(created.id);

      expect(result).toBe(true);
      const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(created.id);
      expect(row).toBeUndefined();
    });

    it('should return false for non-existent ID', async () => {
      const result = await repository.hardDelete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count of non-deleted templates', async () => {
      await repository.create(createTestTemplateData());
      await repository.create(createTestTemplateData());
      await repository.create(createTestTemplateData());

      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should return 0 when no templates exist', async () => {
      const count = await repository.count();

      expect(count).toBe(0);
    });

    it('should filter by where clause', async () => {
      await repository.create(createTestTemplateData({ category: 'image' }));
      await repository.create(createTestTemplateData({ category: 'image' }));
      await repository.create(createTestTemplateData({ category: 'video' }));

      const count = await repository.count({ where: { category: 'image' } });

      expect(count).toBe(2);
    });

    it('should not count soft-deleted templates', async () => {
      const template = await repository.create(createTestTemplateData());
      await repository.create(createTestTemplateData());
      await repository.softDelete(template.id);

      const count = await repository.count();

      expect(count).toBe(1);
    });
  });
});
