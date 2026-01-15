import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateMongoRepository } from './template.mongodb';

describe('TemplateMongoRepository', () => {
  let repository: TemplateMongoRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockModel: any;

  function createMockTemplateModel() {
    const docs: Record<string, unknown>[] = [];

    const createDoc = (data: Record<string, unknown>) => {
      const now = new Date();
      return {
        _id: data._id ?? `mock-id-${Date.now()}-${Math.random()}`,
        name: data.name ?? '',
        description: data.description ?? '',
        category: data.category ?? 'custom',
        nodes: data.nodes ?? [],
        edges: data.edges ?? [],
        isSystem: data.isSystem ?? false,
        isDeleted: data.isDeleted ?? false,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
        save: vi.fn().mockImplementation(async function (this: unknown) {
          return this;
        }),
      };
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

    model.findOne = vi.fn().mockImplementation((filter: Record<string, unknown>) => {
      const doc = docs.find((d) => {
        if (filter._id && d._id !== filter._id) return false;
        if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
        if (filter.name && d.name !== filter.name) return false;
        if (filter.isSystem !== undefined && d.isSystem !== filter.isSystem) return false;
        return true;
      });
      return createQuery(doc ?? null);
    });

    model.find = vi.fn().mockImplementation((filter: Record<string, unknown>) => {
      const filtered = docs.filter((d) => {
        if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
        if (filter.category && d.category !== filter.category) return false;
        if (filter.isSystem !== undefined && d.isSystem !== filter.isSystem) return false;
        return true;
      });
      return createQuery(filtered);
    });

    model.findOneAndUpdate = vi
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
          if (doc && update.$set) Object.assign(doc, update.$set, { updatedAt: new Date() });
          return createQuery(options?.new ? doc : null);
        }
      );

    model.deleteOne = vi.fn().mockImplementation((filter: Record<string, unknown>) => {
      const index = docs.findIndex((d) => d._id === filter._id);
      if (index >= 0) docs.splice(index, 1);
      return { exec: vi.fn().mockResolvedValue({ deletedCount: index >= 0 ? 1 : 0 }) };
    });

    model.countDocuments = vi.fn().mockImplementation((filter: Record<string, unknown>) => {
      const count = docs.filter(
        (d) => filter.isDeleted === undefined || d.isDeleted === filter.isDeleted
      ).length;
      return { exec: vi.fn().mockResolvedValue(count) };
    });

    return Object.assign(model, {
      _docs: docs,
      _reset: () => {
        docs.length = 0;
      },
    });
  }

  beforeEach(() => {
    mockModel = createMockTemplateModel();
    repository = new TemplateMongoRepository(mockModel);
  });

  describe('create', () => {
    it('should create a template', async () => {
      const result = await repository.create({ name: 'Test Template' });
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Template');
    });

    it('should set default values', async () => {
      const result = await repository.create({ name: 'Test' });
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.category).toBe('custom');
      expect(result.isSystem).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return template by ID', async () => {
      const created = await repository.create({ name: 'Find Me' });
      const result = await repository.findById(created.id);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Find Me');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      await repository.create({ name: 'Template 1' });
      await repository.create({ name: 'Template 2' });
      const results = await repository.findAll();
      expect(results).toHaveLength(2);
    });
  });

  describe('findByCategory', () => {
    it('should find templates by category', async () => {
      await repository.create({ name: 'T1', category: 'image' });
      await repository.create({ name: 'T2', category: 'video' });
      const results = await repository.findByCategory('image');
      expect(results).toHaveLength(1);
    });
  });

  describe('findSystemTemplates', () => {
    it('should find system templates', async () => {
      await repository.create({ name: 'System', isSystem: true });
      await repository.create({ name: 'Custom', isSystem: false });
      const results = await repository.findSystemTemplates();
      expect(results).toHaveLength(1);
    });
  });

  describe('upsertSystemTemplate', () => {
    it('should create new system template', async () => {
      const result = await repository.upsertSystemTemplate({ name: 'New System' });
      expect(result.isSystem).toBe(true);
    });

    it('should update existing system template', async () => {
      await repository.create({ name: 'Existing', isSystem: true, description: 'Old' });
      const result = await repository.upsertSystemTemplate({
        name: 'Existing',
        description: 'New',
      });
      expect(result.description).toBe('New');
    });
  });

  describe('update', () => {
    it('should update template', async () => {
      const created = await repository.create({ name: 'Original' });
      const result = await repository.update(created.id, { name: 'Updated' });
      expect(result!.name).toBe('Updated');
    });
  });

  describe('softDelete', () => {
    it('should mark as deleted', async () => {
      const created = await repository.create({ name: 'To Delete' });
      const result = await repository.softDelete(created.id);
      expect(result).not.toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete', async () => {
      const created = await repository.create({ name: 'To Delete' });
      const result = await repository.hardDelete(created.id);
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return count', async () => {
      await repository.create({ name: 'T1' });
      await repository.create({ name: 'T2' });
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
});
