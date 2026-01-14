import { vi } from 'vitest';

// Mock Replicate SDK responses
export const mockReplicateClient = {
  predictions: {
    create: vi.fn().mockResolvedValue({
      id: 'mock-prediction-id',
      status: 'starting',
      urls: { get: 'https://api.replicate.com/v1/predictions/mock-prediction-id' },
    }),
    get: vi.fn().mockResolvedValue({
      id: 'mock-prediction-id',
      status: 'succeeded',
      output: ['https://replicate.delivery/mock-output.png'],
    }),
    cancel: vi.fn().mockResolvedValue({ status: 'canceled' }),
  },
  run: vi.fn().mockResolvedValue(['Generated text response from mock LLM']),
};

// Mock responses per model type
export const mockImageGenResponse = {
  id: 'img-prediction-123',
  status: 'succeeded',
  output: ['https://replicate.delivery/mock-image.png'],
  metrics: { predict_time: 2.5 },
};

export const mockVideoGenResponse = {
  id: 'vid-prediction-456',
  status: 'succeeded',
  output: 'https://replicate.delivery/mock-video.mp4',
  metrics: { predict_time: 15.2 },
};

export const mockLLMResponse = {
  id: 'llm-prediction-789',
  status: 'succeeded',
  output: ['Generated text response from mock LLM'],
  metrics: { input_token_count: 50, output_token_count: 100 },
};

// Mock prediction creation response
export const mockPredictionCreated = {
  id: 'mock-prediction-id',
  status: 'starting',
  urls: { get: 'https://api.replicate.com/v1/predictions/mock-prediction-id' },
};

// Mock prediction status response
export const mockPredictionSucceeded = {
  id: 'mock-prediction-id',
  status: 'succeeded',
  output: ['https://replicate.delivery/mock-output.png'],
  metrics: { predict_time: 5.0 },
};

export const mockPredictionFailed = {
  id: 'mock-prediction-id',
  status: 'failed',
  error: 'Mock error: Model failed to generate output',
};

export const mockPredictionCanceled = {
  id: 'mock-prediction-id',
  status: 'canceled',
};

// Helper to create Replicate SDK mock
export function createReplicateMock() {
  return {
    default: vi.fn().mockImplementation(() => mockReplicateClient),
  };
}

// Reset all mocks
export function resetReplicateMocks() {
  mockReplicateClient.predictions.create.mockClear();
  mockReplicateClient.predictions.get.mockClear();
  mockReplicateClient.predictions.cancel.mockClear();
  mockReplicateClient.run.mockClear();
}
