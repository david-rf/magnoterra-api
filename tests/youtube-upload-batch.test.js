import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import router from '../src/routes/index.js';
import {
  EMPTY_RESPONSE,
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  formatYoutubeUploadBatch,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
};

const extractSection = (markdown, heading) => {
  const start = markdown.indexOf(heading);
  const nextSection = markdown.indexOf('\n\n3)', start);

  if (nextSection === -1) {
    return markdown.slice(start + heading.length).trim();
  }

  return markdown.slice(start + heading.length, nextSection).trim();
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(formatYoutubeUploadBatch({})).toBe(EMPTY_RESPONSE);
    expect(formatYoutubeUploadBatch({ videos: [] })).toBe(EMPTY_RESPONSE);
  });

  it('formats each video with URL, LinkedIn copy and Instagram caption', () => {
    const markdown = formatYoutubeUploadBatch({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Mantencion industrial 4 ohms con certificacion SEC',
        },
      ],
    });

    const linkedIn = extractSection(markdown, '2) Copy LinkedIn empresa:');
    const instagram = extractSection(markdown, '3) Caption Instagram:');

    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedIn.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
    expect(instagram.length).toBeLessThanOrEqual(INSTAGRAM_LIMIT);
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06');
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\bcertific/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:\u03a9|ohm|omega)/i);
  });

  it('responds with markdown from the webhook endpoint', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'fallback_id-1',
            job: 'Proyecto comercial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain(
      '1) URL: https://www.youtube.com/watch?v=fallback_id-1'
    );
  });
});
