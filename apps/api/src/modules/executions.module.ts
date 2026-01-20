import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecutionsController } from '@/controllers/executions.controller';
import { QueueModule } from '@/modules/queue.module';
import { Execution, ExecutionSchema } from '@/schemas/execution.schema';
import { Job, JobSchema } from '@/schemas/job.schema';
import { ExecutionsService } from '@/services/executions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Execution.name, schema: ExecutionSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    forwardRef(() => QueueModule),
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
