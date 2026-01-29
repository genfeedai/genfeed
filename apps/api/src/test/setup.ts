import { beforeEach, vi } from 'vitest';
import {
  mockPredictionCreated,
  mockPredictionSucceeded,
  mockReplicateClient,
} from '@/test/mocks/replicate.mock';

// Mock BullMQ globally to prevent Redis connections in tests
vi.mock('@nestjs/bullmq', () => ({
  BullModule: {
    forRoot: vi.fn().mockReturnValue({ module: class {} }),
    forRootAsync: vi.fn().mockReturnValue({ module: class {} }),
    registerQueue: vi.fn().mockReturnValue({ module: class {} }),
  },
  Processor: () => vi.fn(),
  WorkerHost: class {},
  OnWorkerEvent: () => vi.fn(),
  InjectQueue: () => vi.fn(),
}));

// Mock bullmq directly as well
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: vi.fn().mockResolvedValue(null),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Replicate SDK globally - must return the shared mock instance
vi.mock('replicate', () => {
  return {
    default: vi.fn().mockImplementation(() => mockReplicateClient),
  };
});

// Reset mocks and restore defaults before each test
beforeEach(() => {
  mockReplicateClient.predictions.create.mockReset();
  mockReplicateClient.predictions.get.mockReset();
  mockReplicateClient.predictions.cancel.mockReset();
  mockReplicateClient.run.mockReset();

  // Restore default behaviors
  mockReplicateClient.predictions.create.mockResolvedValue(mockPredictionCreated);
  mockReplicateClient.predictions.get.mockResolvedValue(mockPredictionSucceeded);
  mockReplicateClient.predictions.cancel.mockResolvedValue({ status: 'canceled' });
  mockReplicateClient.run.mockResolvedValue(['Generated text']);
});

// Global test timeout
vi.setConfig({ testTimeout: 30000 });
