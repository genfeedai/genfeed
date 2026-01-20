import { Module } from '@nestjs/common';
import { ProvidersController } from '@/controllers/providers.controller';

@Module({
  controllers: [ProvidersController],
  providers: [],
  exports: [],
})
export class ProvidersModule {}
