import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWebhookResult, setWebhookResult } from './webhook-store';

describe('webhook-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setWebhookResult', () => {
    it('should store a webhook result', () => {
      const predictionId = 'pred-123';
      const result = {
        status: 'succeeded',
        output: ['https://example.com/image.png'],
      };

      setWebhookResult(predictionId, result);

      const stored = getWebhookResult(predictionId);
      expect(stored).toBeDefined();
      expect(stored?.status).toBe('succeeded');
      expect(stored?.output).toEqual(['https://example.com/image.png']);
      expect(stored?.completedAt).toBeDefined();
    });

    it('should store results with errors', () => {
      const predictionId = 'pred-456';
      const result = {
        status: 'failed',
        output: null,
        error: 'API error: Rate limited',
      };

      setWebhookResult(predictionId, result);

      const stored = getWebhookResult(predictionId);
      expect(stored?.status).toBe('failed');
      expect(stored?.error).toBe('API error: Rate limited');
    });

    it('should overwrite existing results', () => {
      const predictionId = 'pred-789';

      setWebhookResult(predictionId, { status: 'processing', output: null });
      setWebhookResult(predictionId, { status: 'succeeded', output: 'final-output' });

      const stored = getWebhookResult(predictionId);
      expect(stored?.status).toBe('succeeded');
      expect(stored?.output).toBe('final-output');
    });
  });

  describe('getWebhookResult', () => {
    it('should return undefined for non-existent prediction', () => {
      const result = getWebhookResult('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return stored result', () => {
      const predictionId = 'pred-get-test';
      setWebhookResult(predictionId, { status: 'succeeded', output: 'test-output' });

      const result = getWebhookResult(predictionId);
      expect(result).toBeDefined();
      expect(result?.output).toBe('test-output');
    });
  });

  describe('cleanup', () => {
    it('should clean up results older than 1 hour', () => {
      const oldPredictionId = 'pred-old';
      const newPredictionId = 'pred-new';

      // Set an old result
      setWebhookResult(oldPredictionId, { status: 'succeeded', output: 'old' });

      // Advance time by more than 1 hour
      vi.advanceTimersByTime(61 * 60 * 1000);

      // Set a new result (triggers cleanup)
      setWebhookResult(newPredictionId, { status: 'succeeded', output: 'new' });

      // Old result should be cleaned up
      expect(getWebhookResult(oldPredictionId)).toBeUndefined();
      // New result should still exist
      expect(getWebhookResult(newPredictionId)).toBeDefined();
    });

    it('should keep results less than 1 hour old', () => {
      const predictionId = 'pred-recent';

      setWebhookResult(predictionId, { status: 'succeeded', output: 'test' });

      // Advance time by less than 1 hour
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Trigger cleanup by setting another result
      setWebhookResult('another-pred', { status: 'succeeded', output: 'other' });

      // Original result should still exist
      expect(getWebhookResult(predictionId)).toBeDefined();
    });
  });
});
