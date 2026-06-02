import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildFeedPayload,
  runContentFeedCycle,
} from '../src/content-feed/service.js';
import { resetSchemaCacheForTests } from '../src/content-feed/schema.js';

vi.mock('../src/db/pool.js', () => ({
  default: {
    query: vi.fn(),
    getPool: vi.fn(),
    close: vi.fn(),
  },
}));

describe('Content feed service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSchemaCacheForTests();
  });

  it('buildFeedPayload maps published items', () => {
    const payload = buildFeedPayload([
      {
        id: 1,
        slug: 'test-item',
        title: 'Test',
        description: 'Desc',
        link_url: 'https://example.com',
        image_url: null,
        published_at: new Date('2026-06-01T12:00:00Z'),
      },
    ]);

    expect(payload.version).toBe('1.0');
    expect(payload.itemCount).toBe(1);
    expect(payload.items[0]).toMatchObject({
      id: '1',
      slug: 'test-item',
      title: 'Test',
      url: 'https://example.com',
    });
  });

  it('runContentFeedCycle publishes pending items', async () => {
    const mockDbPool = await import('../src/db/pool.js');

    mockDbPool.default.query.mockImplementation(async (sql) => {
      if (sql.includes('CREATE TABLE')) {
        return [];
      }

      if (sql.includes('COUNT(*) AS count FROM content_feed_items')) {
        return [{ count: 1 }];
      }

      if (sql.includes("status = 'pending'")) {
        return [
          {
            id: 10,
            slug: 'item-a',
            title: 'Item A',
            description: 'Body',
            image_url: null,
            link_url: 'https://magnoterra.com/a',
            status: 'pending',
          },
        ];
      }

      if (sql.includes('INSERT INTO content_feed_runs')) {
        return { insertId: 99 };
      }

      if (sql.includes("SET status = 'published'")) {
        return [];
      }

      if (sql.includes('UPDATE content_feed_runs')) {
        return [];
      }

      return [];
    });

    const result = await runContentFeedCycle();

    expect(result).toMatchObject({
      runId: 99,
      itemsProcessed: 1,
      itemsPublished: 1,
      status: 'success',
    });
  });
});

describe('Content feed API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSchemaCacheForTests();
  });

  it('GET /api/content-feed returns published feed JSON', async () => {
    const mockDbPool = await import('../src/db/pool.js');

    mockDbPool.default.query.mockImplementation(async (sql) => {
      if (sql.includes('CREATE TABLE')) {
        return [];
      }

      if (sql.includes('COUNT(*) AS count FROM content_feed_items')) {
        return [{ count: 2 }];
      }

      if (sql.includes("status = 'published'")) {
        return [
          {
            id: 1,
            slug: 'published-item',
            title: 'Published',
            description: 'Ready',
            image_url: null,
            link_url: 'https://magnoterra.com',
            published_at: new Date('2026-06-02T10:00:00Z'),
          },
        ];
      }

      return [];
    });

    const response = await request(app).get('/api/content-feed');

    expect(response.status).toBe(200);
    expect(response.body.itemCount).toBe(1);
    expect(response.body.items[0].slug).toBe('published-item');
  });

  it('GET /api/content-feed/status returns automation status', async () => {
    const mockDbPool = await import('../src/db/pool.js');

    mockDbPool.default.query.mockImplementation(async (sql) => {
      if (sql.includes('CREATE TABLE')) {
        return [];
      }

      if (sql.includes('GROUP BY status')) {
        return [
          { status: 'published', count: 2 },
          { status: 'pending', count: 1 },
        ];
      }

      if (sql.includes('FROM content_feed_runs')) {
        return [
          {
            id: 5,
            started_at: new Date('2026-06-02T09:00:00Z'),
            finished_at: new Date('2026-06-02T09:00:01Z'),
            status: 'success',
            items_processed: 1,
            items_published: 1,
            error_message: null,
          },
        ];
      }

      return [{ count: 0 }];
    });

    const response = await request(app).get('/api/content-feed/status');

    expect(response.status).toBe(200);
    expect(response.body.automation).toBe('content-feed');
    expect(response.body.counts.published).toBe(2);
    expect(response.body.latestRun.status).toBe('success');
  });
});
