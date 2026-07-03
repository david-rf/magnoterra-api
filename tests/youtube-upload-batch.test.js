import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import webhooksRouter from '../src/routes/webhooks.js';
import {
  buildYoutubeUploadBatchMarkdown,
  CTA_URL,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
} from '../src/social/youtubeUploadBatch.js';

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api/webhooks', webhooksRouter);

  return app;
};

const extractCopies = (markdown) => markdown.split('\n\n---\n\n').map((block) => {
  const linkedin = block.match(/2\) Copy LinkedIn empresa\n([\s\S]*?)\n\n3\) Caption Instagram/);
  const instagram = block.match(/3\) Caption Instagram\n([\s\S]*)$/);

  return {
    linkedin: linkedin?.[1] || '',
    instagram: instagram?.[1] || '',
  };
});

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns one markdown block per renderable video', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Mantencion planta norte',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'Revision malla de tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('### Video 1');
    expect(response.text).toContain('https://youtu.be/abc123');
    expect(response.text).toContain('### Video 2');
    expect(response.text).toContain('https://youtu.be/def456');

    const copies = extractCopies(response.text);

    expect(copies).toHaveLength(2);
    copies.forEach(({ linkedin, instagram }) => {
      expect(linkedin.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
      expect(linkedin).toContain(CTA_URL);
      expect(linkedin).toContain(REQUIRED_HASHTAGS);
      expect(linkedin).toContain('RIC N06 queda condicionado al proyecto');

      expect(instagram.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
      expect(instagram).toContain(REQUIRED_HASHTAGS);
      expect(instagram).toContain('RIC N06 condicionado al proyecto');
    });
  });

  it('removes disallowed claims from job text', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'safe-copy',
          url: 'https://youtu.be/safe-copy',
          job: 'Medicion 5 \u03a9 con certificacion SEC para cliente industrial',
        },
      ],
    });

    expect(markdown).toContain('https://youtu.be/safe-copy');
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:(?:ohm(?:io)?s?|omega)\b|[\u03a9\u2126])/i);
    expect(markdown).not.toMatch(/\bSEC\b/i);
  });

  it('returns NO_VIDEOS when videos are missing URLs', () => {
    expect(buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { video_id: 'missing-url', job: 'Sin URL' },
      ],
    })).toBe('NO_VIDEOS');
  });
});
