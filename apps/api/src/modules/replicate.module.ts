import { forwardRef, Module } from '@nestjs/common';
import { ReplicateController } from '@/controllers/replicate.controller';
import { CostModule } from '@/modules/cost.module';
import { ExecutionsModule } from '@/modules/executions.module';
import { WorkflowsModule } from '@/modules/workflows.module';
import { ReplicateService } from '@/services/replicate.service';

@Module({
  imports: [forwardRef(() => ExecutionsModule), forwardRef(() => WorkflowsModule), CostModule],
  controllers: [ReplicateController],
  providers: [ReplicateService],
  exports: [ReplicateService],
})
export class ReplicateModule {}
