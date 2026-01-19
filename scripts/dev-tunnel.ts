#!/usr/bin/env bun
import ngrok from '@ngrok/ngrok';
import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const API_PORT = 3001;
const ENV_FILE = 'apps/api/.env';

function updateEnvFile(url: string): void {
  const fullPath = join(process.cwd(), ENV_FILE);
  if (!existsSync(fullPath)) {
    console.warn(`Warning: ${ENV_FILE} not found, skipping update`);
    return;
  }

  let content = readFileSync(fullPath, 'utf-8');

  if (content.includes('WEBHOOK_BASE_URL=')) {
    content = content.replace(/WEBHOOK_BASE_URL=.*/g, `WEBHOOK_BASE_URL=${url}`);
  } else {
    content += `\nWEBHOOK_BASE_URL=${url}`;
  }

  writeFileSync(fullPath, content);
  console.log(`Updated ${ENV_FILE}`);
}

async function main(): Promise<void> {
  console.log('Starting ngrok tunnel...');

  const listener = await ngrok.forward({
    addr: API_PORT,
    authtoken_from_env: true,
  });

  const url = listener.url();
  console.log(`\nNgrok tunnel: ${url}`);
  console.log(`Webhook URL:  ${url}/api/replicate/webhook\n`);

  updateEnvFile(url!);

  console.log('\nStarting dev server...\n');

  const dev = spawn('bun', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  process.on('SIGINT', () => {
    dev.kill();
    ngrok.disconnect();
    process.exit();
  });
}

main();
