import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  CONTACT_CTA,
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
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown with LinkedIn and Instagram copy', () => {
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
    expect(linkedIn).toContain(CONTACT_CTA);
    expect(linkedIn).toContain(REQUIRED_HASHTAGS);
    expect(linkedIn.length).toBeLessThanOrEqual(900);
    expect(instagram).toContain(CONTACT_CTA);
    expect(instagram.length).toBeLessThanOrEqual(500);
  });

  it('removes forbidden omega figures and SEC certificate claims from job copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/secure',
          job: 'Medicion 5 ohm con cert SEC para cliente',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b5\s*(ohm|omega|Ω)\b/i);
    expect(markdown).not.toMatch(/\bcert\s+SEC\b/i);
    expect(markdown).toContain('RIC N06 se revisa segun corresponda al proyecto');
  });

  it('preserves required CTA and hashtags when job text is long', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/long',
          job: 'Proyecto '.repeat(200),
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
    expect(linkedIn.length).toBeLessThanOrEqual(900);
    expect(instagram).toContain(CONTACT_CTA);
    expect(instagram.length).toBeLessThanOrEqual(500);
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
