import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  socialCopyLimits,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('returns NO_VIDEOS for other events', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'other_event',
      videos: [{ video_id: 'abc123', url: 'https://youtu.be/abc123', job: 'Proyecto' }],
    });

    expect(markdown).toBe('NO_VIDEOS');
  });

  it('builds one markdown block per video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { video_id: 'abc123', url: 'https://youtu.be/abc123', job: 'Proyecto A' },
        { video_id: 'def456', url: 'https://youtu.be/def456', job: 'Proyecto B' },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain('1) URL\nhttps://youtu.be/def456');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(markdown).toContain('\n\n---\n\n');
  });

  it('uses video_id as a YouTube URL fallback', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'id with spaces', job: 'Proyecto' }],
    });

    expect(markdown).toContain('https://www.youtube.com/watch?v=id%20with%20spaces');
  });

  it('keeps required copy within limits and avoids prohibited claims', () => {
    expect(socialCopyLimits.linkedInCopy.length).toBeLessThanOrEqual(socialCopyLimits.linkedInMaxChars);
    expect(socialCopyLimits.instagramCaption.length).toBeLessThanOrEqual(socialCopyLimits.instagramMaxChars);
    expect(socialCopyLimits.linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(socialCopyLimits.linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(socialCopyLimits.linkedInCopy).toContain('RIC N06 siempre debe evaluarse segun el proyecto');
    expect(socialCopyLimits.instagramCaption).toContain('RIC N06 depende del proyecto');
    expect(`${socialCopyLimits.linkedInCopy}\n${socialCopyLimits.instagramCaption}`).not.toMatch(/Omega|Ω|cert\s*SEC/i);
  });
});

describe('POST /api/webhooks/youtube-upload-batch', () => {
  it('responds with markdown for youtube_upload_batch payloads', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'abc123', url: 'https://youtu.be/abc123', job: 'Proyecto' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('https://youtu.be/abc123');
    expect(response.text).toContain('Copy LinkedIn empresa');
  });

  it('responds with NO_VIDEOS for empty payloads', async () => {
    const response = await request(createApp()).post('/api/webhooks/youtube-upload-batch').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
