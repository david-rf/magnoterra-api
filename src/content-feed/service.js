import logger from '../lib/logger.js';
import { ensureContentFeedSchema } from './schema.js';
import * as repository from './repository.js';

function validateItem(item) {
  if (!item.title?.trim()) {
    throw new Error(`Item ${item.id}: title is required`);
  }

  if (!item.slug?.trim()) {
    throw new Error(`Item ${item.id}: slug is required`);
  }
}

export function buildFeedPayload(items) {
  return {
    version: '1.0',
    source: 'magnoterra-api',
    generatedAt: new Date().toISOString(),
    itemCount: items.length,
    items: items.map((item) => ({
      id: String(item.id),
      slug: item.slug,
      title: item.title,
      description: item.description ?? '',
      url: item.link_url ?? null,
      imageUrl: item.image_url ?? null,
      publishedAt: item.published_at
        ? new Date(item.published_at).toISOString()
        : null,
    })),
  };
}

export async function getPublishedFeed(limit = 100) {
  await ensureContentFeedSchema();
  const items = await repository.findPublishedItems(limit);
  return buildFeedPayload(items);
}

export async function getAutomationStatus() {
  await ensureContentFeedSchema();

  const [counts, latestRun] = await Promise.all([
    repository.countItemsByStatus(),
    repository.getLatestRun(),
  ]);

  return {
    automation: 'content-feed',
    counts,
    latestRun,
  };
}

export async function runContentFeedCycle() {
  await ensureContentFeedSchema();

  const runId = await repository.startRun();
  let itemsProcessed = 0;
  let itemsPublished = 0;

  try {
    const pendingItems = await repository.findPendingItems();

    for (const item of pendingItems) {
      itemsProcessed += 1;

      try {
        validateItem(item);
        await repository.markItemPublished(item.id);
        itemsPublished += 1;
        logger.info({ itemId: item.id, slug: item.slug }, 'Content feed: item published');
      } catch (error) {
        await repository.markItemFailed(item.id, error.message);
        logger.warn({ itemId: item.id, err: error.message }, 'Content feed: item failed');
      }
    }

    await repository.finishRun(runId, {
      status: 'success',
      itemsProcessed,
      itemsPublished,
    });

    logger.info(
      { runId, itemsProcessed, itemsPublished },
      'Content feed: automation cycle completed',
    );

    return { runId, itemsProcessed, itemsPublished, status: 'success' };
  } catch (error) {
    await repository.finishRun(runId, {
      status: 'failed',
      itemsProcessed,
      itemsPublished,
      errorMessage: error.message,
    });

    logger.error({ runId, err: error.message }, 'Content feed: automation cycle failed');
    throw error;
  }
}
