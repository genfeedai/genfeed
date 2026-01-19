import { forwardRef, Module } from '@nestjs/common';
import { ExecutionsModule } from '../executions/executions.module';
import { TTSService } from './tts.service';

@Module({
  imports: [forwardRef(() => ExecutionsModule)],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}
