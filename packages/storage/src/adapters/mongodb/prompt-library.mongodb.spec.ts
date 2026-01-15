import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromptLibraryMongoRepository } from './prompt-library.mongodb';

describe('PromptLibraryMongoRepository', () => {
  let repository: PromptLibraryMongoRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockModel: any;

  function createMockPromptModel() {
    const docs: Record<string, unknown>[] = [];

    const createDoc = (data: Record<string, unknown>) => {
      const now = new Date();
      return {
        _id: data._id ?? `mock-id-${Date.now()}-${Math.random()}`,
        name: data.name ?? '',
        description: data.description ?? '',
        promptText: data.promptText ?? '',
        styleSettings: data.styleSettings ?? {},
        aspectRatio: data.aspectRatio ?? '1:1',
        preferredModel: data.preferredModel,
        category: data.category ?? 'general',
        tags: data.tags ?? [],
        useCount: data.useCount ?? 0,
        isFeatured: data.isFeatured ?? false,
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
        return true;
      });
      return createQuery(doc ?? null);
    });

    model.find = vi.fn().mockImplementation((filter: Record<string, unknown>) => {
      const filtered = docs.filter((d) => {
        if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
        if (filter.category && d.category !== filter.category) return false;
        if (filter.isFeatured !== undefined && d.isFeatured !== filter.isFeatured) return false;
        if (filter.tags && !(d.tags as string[]).includes(filter.tags as string)) return false;
        return true;
      });
      return createQuery(filtered);
    });

    model.findOneAndUpdate = vi
      .fn()
      .mockImplementation(
        (
          filter: Record<string, unknown>,
          update: { $set?: Record<string, unknown>; $inc?: Record<string, number> },
          options: { new?: boolean }
        ) => {
          const doc = docs.find((d) => {
            if (filter._id && d._id !== filter._id) return false;
            if (filter.isDeleted !== undefined && d.isDeleted !== filter.isDeleted) return false;
            return true;
          });
          if (doc) {
            if (update.$set) Object.assign(doc, update.$set, { updatedAt: new Date() });
            if (update.$inc) {
              for (const [key, val] of Object.entries(update.$inc)) {
                (doc as Record<string, unknown>)[key] =
                  (((doc as Record<string, unknown>)[key] as number) || 0) + val;
              }
            }
          }
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
    mockModel = createMockPromptModel();
    repository = new PromptLibraryMongoRepository(mockModel);
  });

  describe('create', () => {
    it('should create a prompt', async () => {
      const result = await repository.create({ name: 'Test Prompt', promptText: 'A test prompt' });
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Prompt');
      expect(result.promptText).toBe('A test prompt');
    });

    it('should set default values', async () => {
      const result = await repository.create({ name: 'Test', promptText: 'Text' });
      expect(result.styleSettings).toEqual({});
      expect(result.aspectRatio).toBe('1:1');
      expect(result.category).toBe('general');
      expect(result.tags).toEqual([]);
      expect(result.useCount).toBe(0);
      expect(result.isFeatured).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return prompt by ID', async () => {
      const created = await repository.create({ name: 'Find Me', promptText: 'Text' });
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
    it('should return all prompts', async () => {
      await repository.create({ name: 'Prompt 1', promptText: 'Text 1' });
      await repository.create({ name: 'Prompt 2', promptText: 'Text 2' });
      const results = await repository.findAll();
      expect(results).toHaveLength(2);
    });
  });

  describe('findWithFilters', () => {
    it('should filter by category', async () => {
      await repository.create({ name: 'P1', promptText: 'T1', category: 'landscape' });
      await repository.create({ name: 'P2', promptText: 'T2', category: 'portrait' });
      const results = await repository.findWithFilters({ category: 'landscape' });
      expect(results).toHaveLength(1);
    });

    it('should filter by tag', async () => {
      await repository.create({ name: 'P1', promptText: 'T1', tags: ['sunset'] });
      await repository.create({ name: 'P2', promptText: 'T2', tags: ['city'] });
      const results = await repository.findWithFilters({ tag: 'sunset' });
      expect(results).toHaveLength(1);
    });
  });

  describe('findFeatured', () => {
    it('should return featured prompts', async () => {
      await repository.create({ name: 'Featured', promptText: 'T', isFeatured: true });
      await repository.create({ name: 'Not Featured', promptText: 'T', isFeatured: false });
      const results = await repository.findFeatured();
      expect(results).toHaveLength(1);
    });
  });

  describe('incrementUseCount', () => {
    it('should increment use count', async () => {
      const created = await repository.create({ name: 'Test', promptText: 'Text' });
      expect(created.useCount).toBe(0);
      const result = await repository.incrementUseCount(created.id);
      expect(result!.useCount).toBe(1);
    });
  });

  describe('duplicate', () => {
    it('should create a copy', async () => {
      const original = await repository.create({ name: 'Original', promptText: 'Text' });
      const duplicate = await repository.duplicate(original.id);
      expect(duplicate.name).toBe('Original (Copy)');
      expect(duplicate.id).not.toBe(original.id);
    });

    it('should throw for non-existent ID', async () => {
      await expect(repository.duplicate('non-existent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update prompt', async () => {
      const created = await repository.create({ name: 'Original', promptText: 'Text' });
      const result = await repository.update(created.id, { name: 'Updated' });
      expect(result!.name).toBe('Updated');
    });
  });

  describe('softDelete', () => {
    it('should mark as deleted', async () => {
      const created = await repository.create({ name: 'To Delete', promptText: 'Text' });
      const result = await repository.softDelete(created.id);
      expect(result).not.toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete', async () => {
      const created = await repository.create({ name: 'To Delete', promptText: 'Text' });
      const result = await repository.hardDelete(created.id);
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return count', async () => {
      await repository.create({ name: 'P1', promptText: 'T1' });
      await repository.create({ name: 'P2', promptText: 'T2' });
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
});
