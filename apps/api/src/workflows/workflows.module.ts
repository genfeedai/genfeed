import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CostModule } from '../cost/cost.module';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema';
import { WorkflowGeneratorService } from './workflow-generator.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Workflow.name, schema: WorkflowSchema }]),
    CostModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowGeneratorService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
