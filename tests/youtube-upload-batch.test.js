import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  CONTACT_CTA,
  MAX_INSTAGRAM_LENGTH,
  MAX_LINKEDIN_LENGTH,
  REQUIRED_HASHTAGS,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const extractSection = (markdown, heading, nextHeading) => {
  const start = markdown.indexOf(heading);
  const end = nextHeading ? markdown.indexOf(nextHeading) : markdown.length;

  return markdown.slice(start + heading.length, end).trim();
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown(null)).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats each video with only the requested markdown sections', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Malla puesta a tierra industrial',
        },
      ],
    });
    const linkedIn = extractSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagram = extractSection(markdown, '3) Caption Instagram');

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(linkedIn).toContain(CONTACT_CTA);
    expect(linkedIn).toContain(REQUIRED_HASHTAGS);
    expect(linkedIn.length).toBeLessThanOrEqual(MAX_LINKEDIN_LENGTH);
    expect(instagram).toContain(CONTACT_CTA);
    expect(instagram.length).toBeLessThanOrEqual(MAX_INSTAGRAM_LENGTH);
  });

  it('separates multiple videos with markdown dividers', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { url: 'https://youtu.be/one', job: 'Proyecto uno' },
        { url: 'https://youtu.be/two', job: 'Proyecto dos' },
      ],
    });

    expect(markdown).toContain('https://youtu.be/one');
    expect(markdown).toContain('---');
    expect(markdown).toContain('https://youtu.be/two');
  });

  it('removes forbidden omega figures and SEC certificate claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/secure',
          job: 'Medicion 5 ohm, 1,2 Omega y certificado SEC para cliente',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b(?:omega|ohm|ohms)\b/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:omega|ohm|ohms)\b/i);
    expect(markdown).not.toMatch(/\bcert(?:ificado|ificacion)?\s+SEC\b/i);
    expect(markdown).toContain('RIC N06 se revisa segun corresponda al proyecto');
  });

  it('preserves required CTA and hashtags when job text is long', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/long',
          job: 'Proyecto industrial '.repeat(200),
        },
      ],
    });
    const linkedIn = extractSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagram = extractSection(markdown, '3) Caption Instagram');

    expect(linkedIn).toContain(CONTACT_CTA);
    expect(linkedIn).toContain(REQUIRED_HASHTAGS);
    expect(linkedIn.length).toBeLessThanOrEqual(MAX_LINKEDIN_LENGTH);
    expect(instagram).toContain(CONTACT_CTA);
    expect(instagram.length).toBeLessThanOrEqual(MAX_INSTAGRAM_LENGTH);
  });
});

describe('POST /api/webhooks/youtube-upload-batch', () => {
  it('responds with markdown text for youtube upload batch payloads', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ url: 'https://youtu.be/abc123', job: 'Faena minera' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });
});
