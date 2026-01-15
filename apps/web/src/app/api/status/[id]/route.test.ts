import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/replicate/client', () => ({
  getPredictionStatus: vi.fn(),
}));

vi.mock('@/lib/replicate/webhook-store', () => ({
  getWebhookResult: vi.fn(),
}));

import { getPredictionStatus } from '@/lib/replicate/client';
import { getWebhookResult } from '@/lib/replicate/webhook-store';

describe('GET /api/status/[id]', () => {
  const mockPredictionId = 'pred-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return webhook result if available', async () => {
    vi.mocked(getWebhookResult).mockReturnValue({
      status: 'succeeded',
      output: ['https://example.com/image.png'],
      error: undefined,
      completedAt: new Date().toISOString(),
    });

    const request = new NextRequest(`http://localhost/api/status/${mockPredictionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockPredictionId }) });
    const data = await response.json();

    expect(data.status).toBe('succeeded');
    expect(data.output).toEqual(['https://example.com/image.png']);
    expect(vi.mocked(getPredictionStatus)).not.toHaveBeenCalled();
  });

  it('should fall back to Replicate API when no webhook result', async () => {
    vi.mocked(getWebhookResult).mockReturnValue(undefined);
    vi.mocked(getPredictionStatus).mockResolvedValue({
      id: mockPredictionId,
      status: 'succeeded',
      output: ['https://api.com/output.png'],
      error: null,
      metrics: { predict_time: 5.2 },
    });

    const request = new NextRequest(`http://localhost/api/status/${mockPredictionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockPredictionId }) });
    const data = await response.json();

    expect(data.status).toBe('succeeded');
    expect(data.output).toEqual(['https://api.com/output.png']);
    expect(vi.mocked(getPredictionStatus)).toHaveBeenCalledWith(mockPredictionId);
  });

  it('should return processing status with progress', async () => {
    vi.mocked(getWebhookResult).mockReturnValue(undefined);
    vi.mocked(getPredictionStatus).mockResolvedValue({
      id: mockPredictionId,
      status: 'processing',
      output: null,
      error: null,
      metrics: null,
    });

    const request = new NextRequest(`http://localhost/api/status/${mockPredictionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockPredictionId }) });
    const data = await response.json();

    expect(data.status).toBe('processing');
    expect(data.progress).toBe(50);
  });

  it('should return failed status with error', async () => {
    vi.mocked(getWebhookResult).mockReturnValue({
      status: 'failed',
      output: null,
      error: 'Model failed to generate output',
      completedAt: new Date().toISOString(),
    });

    const request = new NextRequest(`http://localhost/api/status/${mockPredictionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockPredictionId }) });
    const data = await response.json();

    expect(data.status).toBe('failed');
    expect(data.error).toBe('Model failed to generate output');
  });

  it('should handle API errors', async () => {
    vi.mocked(getWebhookResult).mockReturnValue(undefined);
    vi.mocked(getPredictionStatus).mockRejectedValue(new Error('Network error'));

    const request = new NextRequest(`http://localhost/api/status/${mockPredictionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockPredictionId }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to check status');
  });
});
