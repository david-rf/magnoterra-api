import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  createYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(createYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(createYoutubeUploadBatchMarkdown(null)).toBe('NO_VIDEOS');
    expect(createYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('creates markdown for each video', () => {
    const markdown = createYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt_123',
          url: 'https://youtu.be/abc123',
          job: 'mall en Santiago',
        },
      ],
    });

    expect(markdown).toContain('### yt_123');
    expect(markdown).toContain('1) URL');
    expect(markdown).toContain('https://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps generated copy within platform limits', () => {
    const video = {
      job: 'proyecto industrial '.repeat(80),
    };

    expect(buildLinkedInCopy(video).length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption(video).length).toBeLessThanOrEqual(500);
  });

  it('does not include forbidden claims or measurements', () => {
    const markdown = createYoutubeUploadBatchMarkdown({
      videos: [{
        video_id: 'yt_456',
        url: 'https://youtu.be/def456',
        job: 'faena minera con 1 ohm y certificado SEC',
      }],
    });

    expect(markdown).not.toMatch(/omega|ohm|cert\s*SEC/i);
    expect(markdown).toContain('RIC N06 se evalua segun las condiciones del proyecto');
  });

  it('serves markdown from the webhook endpoint', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });
});

