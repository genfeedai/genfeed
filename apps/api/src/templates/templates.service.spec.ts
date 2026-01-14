import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Template } from './schemas/template.schema';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  let service: TemplatesService;

  const mockTemplateId = new Types.ObjectId();

  const mockTemplate = {
    _id: mockTemplateId,
    name: 'Test Template',
    description: 'A test template',
    category: 'custom',
    nodes: [
      { id: 'node-1', type: 'promptNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'node-2', type: 'imageGenNode', position: { x: 200, y: 0 }, data: {} },
    ],
    edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
    edgeStyle: 'bezier',
    isSystem: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockImplementation(function (this: typeof mockTemplate) {
      return Promise.resolve(this);
    }),
  };

  const mockTemplateModel = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockTemplate]),
    }),
    findOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockTemplate),
    }),
    findOneAndUpdate: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockTemplate),
    }),
    create: vi.fn().mockResolvedValue(mockTemplate),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: getModelToken(Template.name), useValue: mockTemplateModel },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  describe('onModuleInit', () => {
    it('should seed system templates on startup', async () => {
      mockTemplateModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await service.onModuleInit();

      // Should attempt to create system templates
      expect(mockTemplateModel.findOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const saveMock = vi.fn().mockResolvedValue(mockTemplate);
      const mockModel = vi.fn().mockImplementation(() => ({
        ...mockTemplate,
        save: saveMock,
      }));
      mockModel.find = mockTemplateModel.find;
      mockModel.findOne = mockTemplateModel.findOne;
      mockModel.findOneAndUpdate = mockTemplateModel.findOneAndUpdate;
      mockModel.create = mockTemplateModel.create;

      const testModule = await Test.createTestingModule({
        providers: [
          TemplatesService,
          { provide: getModelToken(Template.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<TemplatesService>(TemplatesService);
      const result = await testService.create({
        name: 'New Template',
        description: 'A new template',
        category: 'custom',
      });

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();
    });

    it('should create template with default nodes and edges', async () => {
      const saveMock = vi.fn().mockResolvedValue(mockTemplate);
      const mockModel = vi.fn().mockImplementation(() => ({
        ...mockTemplate,
        save: saveMock,
      }));
      mockModel.find = mockTemplateModel.find;
      mockModel.findOne = mockTemplateModel.findOne;
      mockModel.findOneAndUpdate = mockTemplateModel.findOneAndUpdate;
      mockModel.create = mockTemplateModel.create;

      const testModule = await Test.createTestingModule({
        providers: [
          TemplatesService,
          { provide: getModelToken(Template.name), useValue: mockModel },
        ],
      }).compile();

      const testService = testModule.get<TemplatesService>(TemplatesService);
      const result = await testService.create({
        name: 'Empty Template',
        category: 'custom',
      });

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted templates', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockTemplate]);
      expect(mockTemplateModel.find).toHaveBeenCalledWith({ isDeleted: false });
    });

    it('should filter by category when provided', async () => {
      await service.findAll('video');

      expect(mockTemplateModel.find).toHaveBeenCalledWith({ isDeleted: false, category: 'video' });
    });

    it('should not filter by category when "all" is passed', async () => {
      await service.findAll('all');

      expect(mockTemplateModel.find).toHaveBeenCalledWith({ isDeleted: false });
    });

    it('should sort templates with system templates first', async () => {
      await service.findAll();

      expect(mockTemplateModel.find().sort).toHaveBeenCalledWith({ isSystem: -1, name: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a single template by ID', async () => {
      // Ensure mock is properly set for this test
      mockTemplateModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockTemplate),
      });

      const result = await service.findOne(mockTemplateId.toString());

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateModel.findOne).toHaveBeenCalledWith({
        _id: mockTemplateId.toString(),
        isDeleted: false,
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update template name', async () => {
      const updatedTemplate = { ...mockTemplate, name: 'Updated Template' };
      mockTemplateModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedTemplate),
      });

      const result = await service.update(mockTemplateId.toString(), { name: 'Updated Template' });

      expect(result.name).toBe('Updated Template');
      expect(mockTemplateModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockTemplateId.toString(), isDeleted: false },
        { $set: { name: 'Updated Template' } },
        { new: true }
      );
    });

    it('should update template category', async () => {
      const updatedTemplate = { ...mockTemplate, category: 'video' };
      mockTemplateModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedTemplate),
      });

      const result = await service.update(mockTemplateId.toString(), { category: 'video' });

      expect(result.category).toBe('video');
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent-id', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete template by setting isDeleted to true', async () => {
      const deletedTemplate = { ...mockTemplate, isDeleted: true };
      mockTemplateModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(deletedTemplate),
      });

      const result = await service.remove(mockTemplateId.toString());

      expect(result.isDeleted).toBe(true);
      expect(mockTemplateModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockTemplateId.toString(), isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
