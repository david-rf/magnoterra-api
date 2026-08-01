import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });

  it('builds markdown for each uploaded video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'publish-social-copy',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'publish-social-copy',
        },
      ],
    });

    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('1) URL: https://youtu.be/def456');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06 aplica condicionado al proyecto');
    expect(markdown).not.toMatch(/omega|ohm|cert\s*SEC|certificacion\s*SEC/i);
  });

  it('keeps social copy under platform limits', () => {
    expect(buildLinkedInCopy().length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption().length).toBeLessThanOrEqual(500);
  });

  it('uses video_id as a fallback URL', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'abc 123' }],
    });

    expect(markdown).toContain(
      '1) URL: https://www.youtube.com/watch?v=abc%20123'
    );
  });

  it('serves the webhook response as markdown', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'publish-social-copy',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).not.toContain('{');
  });
});
