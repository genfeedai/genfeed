import { Module } from '@nestjs/common';
import { CostCalculatorService } from './cost-calculator.service';

@Module({
  providers: [CostCalculatorService],
  exports: [CostCalculatorService],
})
export class CostModule {}
