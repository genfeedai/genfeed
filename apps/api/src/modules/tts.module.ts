import { forwardRef, Module } from '@nestjs/common';
import { ExecutionsModule } from '@/modules/executions.module';
import { TTSService } from '@/services/tts.service';

@Module({
  imports: [forwardRef(() => ExecutionsModule)],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}
