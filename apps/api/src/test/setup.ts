import { beforeEach, vi } from 'vitest';
import {
  mockPredictionCreated,
  mockPredictionSucceeded,
  mockReplicateClient,
} from './mocks/replicate.mock';

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
