import dbPool from '../db/pool.js';

export async function findPendingItems(limit = 50) {
  return dbPool.query(
    `SELECT id, slug, title, description, image_url, link_url, status
     FROM content_feed_items
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
}

export async function markItemPublished(id) {
  await dbPool.query(
    `UPDATE content_feed_items
     SET status = 'published', published_at = UTC_TIMESTAMP(), error_message = NULL
     WHERE id = ?`,
    [id],
  );
}

export async function markItemFailed(id, errorMessage) {
  await dbPool.query(
    `UPDATE content_feed_items
     SET status = 'failed', error_message = ?
     WHERE id = ?`,
    [errorMessage.slice(0, 512), id],
  );
}

export async function findPublishedItems(limit = 100) {
  return dbPool.query(
    `SELECT id, slug, title, description, image_url, link_url, published_at
     FROM content_feed_items
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT ?`,
    [limit],
  );
}

export async function countItemsByStatus() {
  const rows = await dbPool.query(
    `SELECT status, COUNT(*) AS count
     FROM content_feed_items
     GROUP BY status`,
  );

  return rows.reduce((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});
}

export async function startRun() {
  const result = await dbPool.query(
    `INSERT INTO content_feed_runs (status) VALUES ('running')`,
  );

  return result.insertId;
}

export async function finishRun(runId, { status, itemsProcessed, itemsPublished, errorMessage }) {
  await dbPool.query(
    `UPDATE content_feed_runs
     SET finished_at = UTC_TIMESTAMP(),
         status = ?,
         items_processed = ?,
         items_published = ?,
         error_message = ?
     WHERE id = ?`,
    [
      status,
      itemsProcessed,
      itemsPublished,
      errorMessage ? errorMessage.slice(0, 512) : null,
      runId,
    ],
  );
}

export async function getLatestRun() {
  const rows = await dbPool.query(
    `SELECT id, started_at, finished_at, status, items_processed, items_published, error_message
     FROM content_feed_runs
     ORDER BY id DESC
     LIMIT 1`,
  );

  return rows[0] ?? null;
}
