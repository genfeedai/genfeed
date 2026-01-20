import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptLibraryController } from '@/controllers/prompt-library.controller';
import { PromptLibraryItem, PromptLibraryItemSchema } from '@/schemas/prompt-library-item.schema';
import { PromptLibraryService } from '@/services/prompt-library.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PromptLibraryItem.name, schema: PromptLibraryItemSchema }]),
  ],
  controllers: [PromptLibraryController],
  providers: [PromptLibraryService],
  exports: [PromptLibraryService],
})
export class PromptLibraryModule {}
