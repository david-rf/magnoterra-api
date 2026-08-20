import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  buildSocialCopy,
  formatYoutubeUploadBatchMarkdown,
  MAX_INSTAGRAM_CHARS,
  MAX_LINKEDIN_CHARS,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when payload is empty or has no publishable videos', () => {
    expect(formatYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
    expect(formatYoutubeUploadBatchMarkdown({ event: 'other_event', videos: [{ url: 'https://youtu.be/abc' }] }))
      .toBe('NO_VIDEOS');
  });

  it('formats one markdown block per video', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'a1',
          url: ' https://youtu.be/a1 ',
          job: 'No publicar Cert SEC ni 4 Omega',
        },
        {
          video_id: 'b2',
          url: 'https://youtu.be/b2',
          job: 'Otro video',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('1) URL: https://youtu.be/a1');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('1) URL: https://youtu.be/b2');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('https://magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06 queda condicionada al proyecto');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(markdown).not.toContain('Cert SEC');
    expect(markdown).not.toContain('Omega');
  });

  it('keeps generated copy within channel limits', () => {
    const { linkedin, instagram } = buildSocialCopy();

    expect(linkedin.length).toBeLessThanOrEqual(MAX_LINKEDIN_CHARS);
    expect(instagram.length).toBeLessThanOrEqual(MAX_INSTAGRAM_CHARS);
  });

  it('responds with markdown from the webhook endpoint', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'abc123', url: 'https://youtu.be/abc123', job: 'shorts' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
  });
});
