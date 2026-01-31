/**
 * File download helpers for Telegram bot.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TMP_DIR = join(tmpdir(), 'genfeed-tg-bot');

/** Ensure temp directory exists */
export function ensureTmpDir(): string {
  mkdirSync(TMP_DIR, { recursive: true });
  return TMP_DIR;
}

/**
 * Download a Telegram file and save to temp directory.
 * Returns the local file path.
 */
export async function downloadTelegramFile(
  botToken: string,
  filePath: string,
  chatId: number,
  nodeId: string
): Promise<{ localPath: string; telegramUrl: string }> {
  const telegramUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const dir = ensureTmpDir();

  const ext = filePath.includes('.') ? `.${filePath.split('.').pop()}` : '.jpg';
  const localPath = join(dir, `${chatId}-${nodeId}-${Date.now()}${ext}`);

  const response = await fetch(telegramUrl);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(localPath, buffer);

  return { localPath, telegramUrl };
}

/**
 * Format seconds into human-readable duration.
 */
export function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

/**
 * Simple progress bar renderer.
 */
export function renderProgressBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}
