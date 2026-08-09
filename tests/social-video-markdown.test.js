import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  buildYoutubeUploadBatchMarkdown,
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
} from '../src/lib/socialVideoMarkdown.js';
import routes from '../src/routes/index.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const getSection = (markdown, sectionTitle, nextSectionTitle) => {
  const start = markdown.indexOf(sectionTitle);
  const end = nextSectionTitle
    ? markdown.indexOf(nextSectionTitle)
    : markdown.length;

  return markdown.slice(start + sectionTitle.length, end).trim();
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload is empty or not a youtube batch', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'other_event',
        videos: [{ url: 'https://youtu.be/ignored' }],
      })
    ).toBe('NO_VIDEOS');
  });

  it('formats every video with only URL, LinkedIn copy, and Instagram caption', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example-1',
          job: 'Proyecto industrial 2 \u03a9 con cert SEC y 3 omega',
        },
        {
          video_id: 'yt-002',
          job: { project: 'Edificio comercial' },
        },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtu.be/example-1');
    expect(markdown).toContain(
      '1) URL\nhttps://www.youtube.com/watch?v=yt-002'
    );
    expect(markdown.match(/1\) URL/g)).toHaveLength(2);
    expect(markdown.match(/2\) Copy LinkedIn empresa/g)).toHaveLength(2);
    expect(markdown.match(/3\) Caption Instagram/g)).toHaveLength(2);
    expect(markdown).toContain(CONTACT_CTA);
    expect(markdown).toContain(REQUIRED_HASHTAGS);
    expect(markdown).toContain('RIC N06 se evalua segun las condiciones');
    expect(markdown).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(?:\u03a9|\u03c9|omega|ohms?|ohmios?)\b/i
    );
    expect(markdown).not.toMatch(/\bSEC\b|cert/i);
  });

  it('keeps social copy within requested character limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example-1',
          job: 'Proyecto de infraestructura electrica para instalacion critica con descripcion extensa '.repeat(
            20
          ),
        },
      ],
    });

    const linkedInCopy = getSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = getSection(markdown, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
    expect(linkedInCopy).toContain(CONTACT_CTA);
    expect(linkedInCopy).toContain(REQUIRED_HASHTAGS);
  });

  it('serves text markdown from both webhook routes', async () => {
    const app = createApp();

    const specificResponse = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    const genericResponse = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'abc123', url: 'https://youtu.be/abc123' }],
      });

    expect(specificResponse.status).toBe(200);
    expect(specificResponse.headers['content-type']).toContain('text/markdown');
    expect(specificResponse.text).toBe('NO_VIDEOS');
    expect(genericResponse.status).toBe(200);
    expect(genericResponse.headers['content-type']).toContain('text/markdown');
    expect(genericResponse.text).toContain('1) URL\nhttps://youtu.be/abc123');
  });
});
