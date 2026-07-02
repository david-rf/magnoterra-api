import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

vi.mock('../src/db/pool.js', () => ({
  default: {
    close: vi.fn(),
    getPool: vi.fn(),
    query: vi.fn(),
  },
}));

const extractSection = (markdown, title, nextTitle) => {
  const start = markdown.indexOf(title);
  const end = nextTitle ? markdown.indexOf(nextTitle, start) : markdown.length;

  return markdown.slice(start + title.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS as markdown when the payload has no videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown social copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Malla industrial 5 Ohm con cert SEC y RIC N06 garantizado',
          },
        ],
      });

    const linkedin = extractSection(
      response.text,
      '2) Copy LinkedIn empresa:',
      '3) Caption Instagram:',
    );
    const instagram = extractSection(response.text, '3) Caption Instagram:');

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedin.length).toBeLessThanOrEqual(900);
    expect(instagram.length).toBeLessThanOrEqual(500);
    expect(linkedin).toContain('https://magnoterra.cl/contacto');
    expect(linkedin).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 debe evaluarse segun las condiciones de cada proyecto');
    expect(response.text).toContain('RIC N06 se evalua segun el proyecto');
    expect(response.text).not.toMatch(/\b(?:SEC|ohm|omega)\b/i);
  });

  it('renders one markdown block per video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { video_id: 'one', url: 'https://youtu.be/one', job: 'Condominio' },
        { video_id: 'two', url: 'https://youtu.be/two', job: 'Planta' },
      ],
    });

    expect(markdown).toContain('https://youtu.be/one');
    expect(markdown).toContain('https://youtu.be/two');
    expect(markdown.split('\n\n---\n\n')).toHaveLength(2);
  });
});
