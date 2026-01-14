import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExecutionsModule } from './executions/executions.module';
import { ReplicateModule } from './replicate/replicate.module';
import { TemplatesModule } from './templates/templates.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    // Configuration (checks local dir first, then root)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.production',
        '.env.local',
        '.env',
        '../../.env.production',
        '../../.env.local',
        '../../.env',
      ],
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    WorkflowsModule,
    TemplatesModule,
    ExecutionsModule,
    ReplicateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
