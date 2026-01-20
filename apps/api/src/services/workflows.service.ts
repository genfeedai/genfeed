import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateWorkflowDto } from '@/dto/create-workflow.dto';
import type { UpdateWorkflowDto } from '@/dto/update-workflow.dto';
import { Workflow, type WorkflowDocument } from '@/schemas/workflow.schema';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(Workflow.name)
    private readonly workflowModel: Model<WorkflowDocument>
  ) {}

  async create(dto: CreateWorkflowDto): Promise<WorkflowDocument> {
    const workflow = new this.workflowModel({
      name: dto.name,
      description: dto.description ?? '',
      nodes: dto.nodes ?? [],
      edges: dto.edges ?? [],
      edgeStyle: dto.edgeStyle ?? 'smoothstep',
      groups: dto.groups ?? [],
    });
    return workflow.save();
  }

  async findAll(): Promise<WorkflowDocument[]> {
    return this.workflowModel.find({ isDeleted: false }).sort({ updatedAt: -1 }).exec();
  }

  async findOne(id: string): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async update(id: string, dto: UpdateWorkflowDto): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: dto }, { new: true })
      .exec();
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async remove(id: string): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async duplicate(id: string): Promise<WorkflowDocument> {
    const original = await this.findOne(id);
    const duplicate = new this.workflowModel({
      name: `${original.name} (copy)`,
      description: original.description,
      nodes: original.nodes,
      edges: original.edges,
      edgeStyle: original.edgeStyle,
      groups: original.groups,
    });
    return duplicate.save();
  }
}
