import dotenv from 'dotenv';
import logger from '../lib/logger.js';
import { runContentFeedCycle } from '../content-feed/service.js';

dotenv.config();

const intervalMs = Number(process.env.CONTENT_FEED_INTERVAL_MS || 60_000);
const runOnce = process.argv.includes('--once');

async function tick() {
  const result = await runContentFeedCycle();
  logger.info(result, 'Content feed worker: tick finished');
}

async function main() {
  logger.info(
    { intervalMs, runOnce },
    'Content feed worker: starting automation',
  );

  if (runOnce) {
    await tick();
    process.exit(0);
  }

  await tick();

  setInterval(() => {
    tick().catch((error) => {
      logger.error({ err: error.message }, 'Content feed worker: tick error');
    });
  }, intervalMs);
}

main().catch((error) => {
  logger.error({ err: error.message }, 'Content feed worker: fatal error');
  process.exit(1);
});
