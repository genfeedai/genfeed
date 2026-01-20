import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowDto } from '@/dto/create-workflow.dto';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {}
