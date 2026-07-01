import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatchMarkdown.js';

vi.mock('../src/db/pool.js', () => ({
  default: {
    close: vi.fn(),
    getPool: vi.fn().mockResolvedValue({}),
    query: vi.fn(),
  },
}));

const getSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel);

  if (start === -1 || end === -1 || end <= start) {
    return '';
  }

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('responds NO_VIDEOS when the payload has no videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('responds NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('renders one markdown block per video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'mantencion de malla para planta industrial',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'diagnostico de sistema de puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/def456');
    expect(response.text).toContain('---');
    expect(response.text).toContain('https://magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps LinkedIn and Instagram text within character limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: 'x'.repeat(500),
        },
      ],
    });

    const linkedInCopy = getSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = markdown
      .slice(
        markdown.indexOf('3) Caption Instagram') + '3) Caption Instagram'.length
      )
      .trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('removes restricted compliance claims from incoming job text', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'medicion 0,5 ohm con certificado SEC y RIC N06',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*ohm\b/i);
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).toContain('RIC N06 segun condiciones del proyecto');
  });
});
