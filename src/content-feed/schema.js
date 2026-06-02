import dbPool from '../db/pool.js';
import logger from '../lib/logger.js';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS content_feed_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  link_url VARCHAR(512),
  status ENUM('draft', 'pending', 'published', 'failed') NOT NULL DEFAULT 'pending',
  error_message VARCHAR(512) NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_content_feed_status (status),
  INDEX idx_content_feed_published_at (published_at)
);

CREATE TABLE IF NOT EXISTS content_feed_runs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  status ENUM('running', 'success', 'failed') NOT NULL DEFAULT 'running',
  items_processed INT UNSIGNED NOT NULL DEFAULT 0,
  items_published INT UNSIGNED NOT NULL DEFAULT 0,
  error_message VARCHAR(512) NULL
);
`;

const SEED_SQL = `
INSERT IGNORE INTO content_feed_items (slug, title, description, image_url, link_url, status)
VALUES
  ('bienvenida-magno-terra', 'Bienvenido a Magno Terra', 'Descubre productos de calidad para tu hogar y jardín.', NULL, 'https://magnoterra.com', 'pending'),
  ('novedades-temporada', 'Novedades de temporada', 'Lo último en catálogo, listo para publicar en el feed.', NULL, 'https://magnoterra.com/novedades', 'pending');
`;

let schemaReady = false;

export async function ensureContentFeedSchema() {
  if (schemaReady) {
    return;
  }

  const statements = MIGRATION_SQL.split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await dbPool.query(statement);
  }

  const [{ count }] = await dbPool.query(
    'SELECT COUNT(*) AS count FROM content_feed_items',
  );

  if (Number(count) === 0) {
    const seedStatements = SEED_SQL.split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of seedStatements) {
      await dbPool.query(statement);
    }

    logger.info('Content feed: seeded initial pending items');
  }

  schemaReady = true;
  logger.info('Content feed: schema ready');
}

export function resetSchemaCacheForTests() {
  schemaReady = false;
}
