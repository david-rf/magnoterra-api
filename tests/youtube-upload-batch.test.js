import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_LINKEDIN_HASHTAGS,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const getFieldValue = (markdown, label) => {
  const line = markdown.split('\n').find((entry) => entry.startsWith(label));

  return line.replace(label, '');
};

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('builds markdown with the requested social copy fields', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Proyecto industrial',
        },
      ],
    });

    const linkedInCopy = getFieldValue(markdown, '2) Copy LinkedIn empresa: ');
    const instagramCaption = getFieldValue(markdown, '3) Caption Instagram: ');

    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedInCopy).toContain(CONTACT_CTA);
    expect(linkedInCopy).toContain(REQUIRED_LINKEDIN_HASHTAGS);
    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
    expect(markdown).not.toMatch(/omega|ohm|certificacion sec|cert sec|sec/i);
  });

  it('responds with markdown from the webhook route', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'video-1',
            url: 'https://www.youtube.com/watch?v=video-1',
            job: 'Mantencion',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://www.youtube.com/watch?v=video-1');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
  });
});
