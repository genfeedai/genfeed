import { Module } from '@nestjs/common';
import { ExecutionsModule } from '../executions/executions.module';
import { ReplicateController } from './replicate.controller';
import { ReplicateService } from './replicate.service';

@Module({
  imports: [ExecutionsModule],
  controllers: [ReplicateController],
  providers: [ReplicateService],
  exports: [ReplicateService],
})
export class ReplicateModule {}
