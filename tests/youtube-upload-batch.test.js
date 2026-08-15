import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  getInstagramCaption,
  getLinkedinCompanyCopy,
  renderYoutubeUploadBatchMarkdown,
  SOCIAL_COPY_LIMITS,
  YOUTUBE_UPLOAD_BATCH_EVENT,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(renderYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(
      renderYoutubeUploadBatchMarkdown({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [],
      })
    ).toBe('NO_VIDEOS');
  });

  it('renders markdown for each valid video', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Medicion 0,5 Omega con cert SEC',
        },
        {
          video_id: 'def456',
          url: 'https://www.youtube.com/watch?v=def456',
          job: 'Mantencion industrial',
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://youtu.be/abc123');
    expect(markdown).toContain(
      '1. URL: https://www.youtube.com/watch?v=def456'
    );
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
    expect(markdown).toContain('---');
    expect(markdown).not.toMatch(/Omega|ohm|SEC|0,5|0\.5/u);
  });

  it('keeps platform copy under the requested limits and includes required CTA and hashtags', () => {
    const linkedin = getLinkedinCompanyCopy();
    const instagram = getInstagramCaption();
    const requiredText = [
      'magnoterra.cl/contacto',
      '#PuestaATierra',
      '#Chile',
      '#MagnoTerra',
    ];

    expect(linkedin.length).toBeLessThanOrEqual(SOCIAL_COPY_LIMITS.linkedin);
    expect(instagram.length).toBeLessThanOrEqual(SOCIAL_COPY_LIMITS.instagram);

    for (const text of requiredText) {
      expect(linkedin).toContain(text);
      expect(instagram).toContain(text);
    }

    expect(linkedin).toContain('RIC N06');
    expect(instagram).toContain('RIC N06');
    expect(`${linkedin} ${instagram}`).not.toMatch(/Omega|ohm|SEC/u);
  });
});

describe('POST /api/webhooks/youtube-upload-batch', () => {
  it('responds with text/markdown for a valid webhook payload', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Instalacion comercial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/u);
    expect(response.text).toContain('1. URL: https://youtu.be/abc123');
    expect(response.text).toContain('magnoterra.cl/contacto');
  });

  it('responds NO_VIDEOS when there are no valid videos', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [{ video_id: 'abc123', url: '' }],
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
