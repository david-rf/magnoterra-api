import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_HASHTAGS,
  LINKEDIN_MAX_LENGTH,
  buildYoutubeUploadBatchMarkdown,
} from '../src/lib/youtubeSocialCopy.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const extractSection = (markdown, label) => {
  const pattern = new RegExp(`${label}\\n([\\s\\S]*?)(?:\\n\\n\\d\\)|$)`);
  return markdown.match(pattern)?.[1].trim() || '';
};

describe('youtube upload batch social copy', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });

  it('builds markdown with URL, LinkedIn copy and Instagram caption per video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: {
            title: 'Instalacion industrial con 5 ohm y cert SEC',
            region: 'Chile',
          },
        },
      ],
    });

    const linkedInCopy = extractSection(markdown, '2\\) Copy LinkedIn empresa');
    const instagramCaption = extractSection(markdown, '3\\) Caption Instagram');

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain('2) Copy LinkedIn empresa');
    expect(markdown).toContain('3) Caption Instagram');
    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
    expect(linkedInCopy).toContain(CONTACT_CTA);
    expect(linkedInCopy).toContain(LINKEDIN_HASHTAGS);
    expect(markdown).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(?:\u03a9|ohm(?:s|ios)?|omega)\b/i
    );
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).toContain(
      'RIC N06 se evalua segun corresponda al proyecto'
    );
  });

  it('responds with markdown from POST /api/webhooks', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'fallback-id',
            job: 'Mantenimiento preventivo de sistemas de puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain(
      'https://www.youtube.com/watch?v=fallback-id'
    );
    expect(response.text).toContain('magnoterra.cl/contacto');
  });
});
