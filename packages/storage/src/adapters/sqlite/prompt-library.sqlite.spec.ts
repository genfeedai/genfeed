import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestPromptData,
  PROMPT_LIBRARY_SCHEMA,
} from '../../test/test-utils';
import { PromptLibrarySqliteRepository } from './prompt-library.sqlite';

describe('PromptLibrarySqliteRepository', () => {
  let db: Database.Database;
  let repository: PromptLibrarySqliteRepository;

  beforeEach(() => {
    db = createTestDatabase(PROMPT_LIBRARY_SCHEMA);
    repository = new PromptLibrarySqliteRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a prompt with generated UUID', async () => {
      const data = createTestPromptData({ name: 'My Prompt' });

      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.name).toBe('My Prompt');
    });

    it('should set default values for optional fields', async () => {
      const data = { name: 'Minimal Prompt', promptText: 'Test prompt text' };

      const result = await repository.create(data);

      expect(result.description).toBe('');
      expect(result.aspectRatio).toBe('1:1');
      expect(result.category).toBe('general');
      expect(result.tags).toEqual([]);
      expect(result.useCount).toBe(0);
      expect(result.isFeatured).toBe(false);
      expect(result.isDeleted).toBe(false);
    });

    it('should serialize styleSettings as JSON', async () => {
      const data = createTestPromptData({
        styleSettings: { mood: 'cinematic', style: 'anime' },
      });

      const result = await repository.create(data);

      expect(result.styleSettings).toEqual({ mood: 'cinematic', style: 'anime' });
    });

    it('should serialize tags as JSON', async () => {
      const data = createTestPromptData({
        tags: ['landscape', 'sunset', 'nature'],
      });

      const result = await repository.create(data);

      expect(result.tags).toEqual(['landscape', 'sunset', 'nature']);
    });

    it('should create featured prompt', async () => {
      const data = createTestPromptData({ isFeatured: true });

      const result = await repository.create(data);

      expect(result.isFeatured).toBe(true);
    });

    it('should set preferredModel if provided', async () => {
      const data = createTestPromptData({ preferredModel: 'flux-pro' });

      const result = await repository.create(data);

      expect(result.preferredModel).toBe('flux-pro');
    });

    it('should set thumbnail if provided', async () => {
      const data = createTestPromptData({ thumbnail: 'https://example.com/thumb.jpg' });

      const result = await repository.create(data);

      expect(result.thumbnail).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('findById', () => {
    it('should return prompt by ID', async () => {
      const created = await repository.create(createTestPromptData({ name: 'Find Me' }));

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Find Me');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted prompts', async () => {
      const created = await repository.create(createTestPromptData());
      await repository.softDelete(created.id);

      const result = await repository.findById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find prompt by name', async () => {
      await repository.create(createTestPromptData({ name: 'Unique Name' }));

      const result = await repository.findOne({ where: { name: 'Unique Name' } });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Unique Name');
    });

    it('should find prompt by category', async () => {
      await repository.create(createTestPromptData({ category: 'portrait' }));

      const result = await repository.findOne({ where: { category: 'portrait' } });

      expect(result).not.toBeNull();
      expect(result!.category).toBe('portrait');
    });

    it('should find prompt by isFeatured flag', async () => {
      await repository.create(createTestPromptData({ isFeatured: true }));
      await repository.create(createTestPromptData({ isFeatured: false }));

      const result = await repository.findOne({ where: { isFeatured: true } });

      expect(result).not.toBeNull();
      expect(result!.isFeatured).toBe(true);
    });

    it('should return null if no match', async () => {
      const result = await repository.findOne({ where: { name: 'Does Not Exist' } });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted prompts', async () => {
      await repository.create(createTestPromptData({ name: 'Prompt 1' }));
      await repository.create(createTestPromptData({ name: 'Prompt 2' }));
      await repository.create(createTestPromptData({ name: 'Prompt 3' }));

      const results = await repository.findAll();

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no prompts exist', async () => {
      const results = await repository.findAll();

      expect(results).toEqual([]);
    });

    it('should order by updated_at DESC by default', async () => {
      const first = await repository.create(createTestPromptData({ name: 'First' }));
      await new Promise((r) => setTimeout(r, 10));
      await repository.create(createTestPromptData({ name: 'Second' }));
      await new Promise((r) => setTimeout(r, 10));
      await repository.update(first.id, { name: 'First Updated' });

      const results = await repository.findAll();

      expect(results[0].name).toBe('First Updated');
    });

    it('should support custom sorting', async () => {
      await repository.create(createTestPromptData({ name: 'Zebra' }));
      await repository.create(createTestPromptData({ name: 'Apple' }));

      const results = await repository.findAll({ sortBy: 'name', sortOrder: 'asc' });

      expect(results[0].name).toBe('Apple');
      expect(results[1].name).toBe('Zebra');
    });

    it('should support limit and offset', async () => {
      await repository.create(createTestPromptData({ name: 'A' }));
      await repository.create(createTestPromptData({ name: 'B' }));
      await repository.create(createTestPromptData({ name: 'C' }));

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

  describe('findWithFilters', () => {
    it('should filter by category', async () => {
      await repository.create(createTestPromptData({ category: 'landscape' }));
      await repository.create(createTestPromptData({ category: 'portrait' }));
      await repository.create(createTestPromptData({ category: 'landscape' }));

      const results = await repository.findWithFilters({ category: 'landscape' });

      expect(results).toHaveLength(2);
      expect(results.every((p) => p.category === 'landscape')).toBe(true);
    });

    it('should filter by tag', async () => {
      await repository.create(createTestPromptData({ tags: ['sunset', 'nature'] }));
      await repository.create(createTestPromptData({ tags: ['portrait', 'studio'] }));
      await repository.create(createTestPromptData({ tags: ['sunset', 'city'] }));

      const results = await repository.findWithFilters({ tag: 'sunset' });

      expect(results).toHaveLength(2);
    });

    it('should search by name', async () => {
      await repository.create(createTestPromptData({ name: 'Beautiful Sunset' }));
      await repository.create(createTestPromptData({ name: 'City Skyline' }));

      const results = await repository.findWithFilters({ search: 'sunset' });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Beautiful Sunset');
    });

    it('should search by description', async () => {
      await repository.create(createTestPromptData({ description: 'A stunning mountain view' }));
      await repository.create(createTestPromptData({ description: 'Urban photography' }));

      const results = await repository.findWithFilters({ search: 'mountain' });

      expect(results).toHaveLength(1);
    });

    it('should search by prompt text', async () => {
      await repository.create(createTestPromptData({ promptText: 'A serene lake at dawn' }));
      await repository.create(createTestPromptData({ promptText: 'Busy city street' }));

      const results = await repository.findWithFilters({ search: 'serene' });

      expect(results).toHaveLength(1);
    });

    it('should combine multiple filters', async () => {
      await repository.create(
        createTestPromptData({ category: 'landscape', tags: ['sunset'], name: 'Mountain Sunset' })
      );
      await repository.create(
        createTestPromptData({ category: 'landscape', tags: ['river'], name: 'Mountain River' })
      );
      await repository.create(
        createTestPromptData({ category: 'portrait', tags: ['sunset'], name: 'Portrait Sunset' })
      );

      const results = await repository.findWithFilters({
        category: 'landscape',
        tag: 'sunset',
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Mountain Sunset');
    });

    it('should support sorting', async () => {
      await repository.create(createTestPromptData({ name: 'Zebra', category: 'test' }));
      await repository.create(createTestPromptData({ name: 'Apple', category: 'test' }));

      const results = await repository.findWithFilters({
        category: 'test',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(results[0].name).toBe('Apple');
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(createTestPromptData({ category: 'test' }));
      }

      const results = await repository.findWithFilters({
        category: 'test',
        limit: 2,
        offset: 1,
      });

      expect(results).toHaveLength(2);
    });
  });

  describe('findFeatured', () => {
    it('should return only featured prompts', async () => {
      await repository.create(createTestPromptData({ isFeatured: true }));
      await repository.create(createTestPromptData({ isFeatured: true }));
      await repository.create(createTestPromptData({ isFeatured: false }));

      const results = await repository.findFeatured();

      expect(results).toHaveLength(2);
      expect(results.every((p) => p.isFeatured)).toBe(true);
    });

    it('should order by use count DESC', async () => {
      const p1 = await repository.create(createTestPromptData({ isFeatured: true }));
      const p2 = await repository.create(createTestPromptData({ isFeatured: true }));

      await repository.incrementUseCount(p2.id);
      await repository.incrementUseCount(p2.id);
      await repository.incrementUseCount(p1.id);

      const results = await repository.findFeatured();

      expect(results[0].id).toBe(p2.id);
      expect(results[0].useCount).toBe(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 15; i++) {
        await repository.create(createTestPromptData({ isFeatured: true }));
      }

      const results = await repository.findFeatured(5);

      expect(results).toHaveLength(5);
    });

    it('should use default limit of 10', async () => {
      for (let i = 0; i < 15; i++) {
        await repository.create(createTestPromptData({ isFeatured: true }));
      }

      const results = await repository.findFeatured();

      expect(results).toHaveLength(10);
    });

    it('should return empty array when no featured prompts exist', async () => {
      await repository.create(createTestPromptData({ isFeatured: false }));

      const results = await repository.findFeatured();

      expect(results).toEqual([]);
    });
  });

  describe('incrementUseCount', () => {
    it('should increment use count by 1', async () => {
      const created = await repository.create(createTestPromptData());
      expect(created.useCount).toBe(0);

      const result = await repository.incrementUseCount(created.id);

      expect(result).not.toBeNull();
      expect(result!.useCount).toBe(1);
    });

    it('should increment multiple times', async () => {
      const created = await repository.create(createTestPromptData());

      await repository.incrementUseCount(created.id);
      await repository.incrementUseCount(created.id);
      const result = await repository.incrementUseCount(created.id);

      expect(result!.useCount).toBe(3);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await repository.create(createTestPromptData());
      await new Promise((r) => setTimeout(r, 10));

      const result = await repository.incrementUseCount(created.id);

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.incrementUseCount('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('duplicate', () => {
    it('should create copy with (Copy) suffix', async () => {
      const original = await repository.create(createTestPromptData({ name: 'Original Prompt' }));

      const result = await repository.duplicate(original.id);

      expect(result.name).toBe('Original Prompt (Copy)');
      expect(result.id).not.toBe(original.id);
    });

    it('should copy prompt text and style settings', async () => {
      const original = await repository.create(
        createTestPromptData({
          promptText: 'A magical forest',
          styleSettings: { mood: 'fantasy', lighting: 'dramatic' },
        })
      );

      const result = await repository.duplicate(original.id);

      expect(result.promptText).toBe('A magical forest');
      expect(result.styleSettings).toEqual({ mood: 'fantasy', lighting: 'dramatic' });
    });

    it('should copy tags and category', async () => {
      const original = await repository.create(
        createTestPromptData({
          category: 'fantasy',
          tags: ['magical', 'forest', 'nature'],
        })
      );

      const result = await repository.duplicate(original.id);

      expect(result.category).toBe('fantasy');
      expect(result.tags).toEqual(['magical', 'forest', 'nature']);
    });

    it('should reset isFeatured to false', async () => {
      const original = await repository.create(createTestPromptData({ isFeatured: true }));

      const result = await repository.duplicate(original.id);

      expect(result.isFeatured).toBe(false);
    });

    it('should reset use count to 0', async () => {
      const original = await repository.create(createTestPromptData());
      await repository.incrementUseCount(original.id);
      await repository.incrementUseCount(original.id);

      const result = await repository.duplicate(original.id);

      expect(result.useCount).toBe(0);
    });

    it('should throw for non-existent ID', async () => {
      await expect(repository.duplicate('non-existent')).rejects.toThrow(
        'Prompt with ID non-existent not found'
      );
    });
  });

  describe('update', () => {
    it('should update prompt name', async () => {
      const created = await repository.create(createTestPromptData({ name: 'Original' }));

      const result = await repository.update(created.id, { name: 'Updated' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Updated');
    });

    it('should update prompt text', async () => {
      const created = await repository.create(createTestPromptData({ promptText: 'Old text' }));

      const result = await repository.update(created.id, { promptText: 'New text' });

      expect(result!.promptText).toBe('New text');
    });

    it('should update style settings', async () => {
      const created = await repository.create(createTestPromptData());

      const result = await repository.update(created.id, {
        styleSettings: { mood: 'dark', style: 'gothic' },
      });

      expect(result!.styleSettings).toEqual({ mood: 'dark', style: 'gothic' });
    });

    it('should update aspect ratio', async () => {
      const created = await repository.create(createTestPromptData({ aspectRatio: '16:9' }));

      const result = await repository.update(created.id, { aspectRatio: '1:1' });

      expect(result!.aspectRatio).toBe('1:1');
    });

    it('should update preferred model', async () => {
      const created = await repository.create(createTestPromptData());

      const result = await repository.update(created.id, { preferredModel: 'flux-dev' });

      expect(result!.preferredModel).toBe('flux-dev');
    });

    it('should update category', async () => {
      const created = await repository.create(createTestPromptData({ category: 'old' }));

      const result = await repository.update(created.id, { category: 'new' });

      expect(result!.category).toBe('new');
    });

    it('should update tags', async () => {
      const created = await repository.create(createTestPromptData({ tags: ['old'] }));

      const result = await repository.update(created.id, { tags: ['new', 'tags'] });

      expect(result!.tags).toEqual(['new', 'tags']);
    });

    it('should update isFeatured flag', async () => {
      const created = await repository.create(createTestPromptData({ isFeatured: false }));

      const result = await repository.update(created.id, { isFeatured: true });

      expect(result!.isFeatured).toBe(true);
    });

    it('should update thumbnail', async () => {
      const created = await repository.create(createTestPromptData());

      const result = await repository.update(created.id, {
        thumbnail: 'https://new-thumb.jpg',
      });

      expect(result!.thumbnail).toBe('https://new-thumb.jpg');
    });

    it('should update updatedAt timestamp', async () => {
      const created = await repository.create(createTestPromptData());
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
    it('should mark prompt as deleted', async () => {
      const created = await repository.create(createTestPromptData());

      const result = await repository.softDelete(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
    });

    it('should prevent finding deleted prompt', async () => {
      const created = await repository.create(createTestPromptData());
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
    it('should permanently remove prompt', async () => {
      const created = await repository.create(createTestPromptData());

      const result = await repository.hardDelete(created.id);

      expect(result).toBe(true);
      const row = db.prepare('SELECT * FROM prompt_library WHERE id = ?').get(created.id);
      expect(row).toBeUndefined();
    });

    it('should return false for non-existent ID', async () => {
      const result = await repository.hardDelete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count of non-deleted prompts', async () => {
      await repository.create(createTestPromptData());
      await repository.create(createTestPromptData());
      await repository.create(createTestPromptData());

      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should return 0 when no prompts exist', async () => {
      const count = await repository.count();

      expect(count).toBe(0);
    });

    it('should filter by where clause', async () => {
      await repository.create(createTestPromptData({ category: 'landscape' }));
      await repository.create(createTestPromptData({ category: 'landscape' }));
      await repository.create(createTestPromptData({ category: 'portrait' }));

      const count = await repository.count({ where: { category: 'landscape' } });

      expect(count).toBe(2);
    });

    it('should not count soft-deleted prompts', async () => {
      const prompt = await repository.create(createTestPromptData());
      await repository.create(createTestPromptData());
      await repository.softDelete(prompt.id);

      const count = await repository.count();

      expect(count).toBe(1);
    });
  });
});
