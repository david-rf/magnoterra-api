import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  EMPTY_RESPONSE,
  INSTAGRAM_CAPTION,
  LINKEDIN_COPY,
  YOUTUBE_UPLOAD_BATCH_EVENT,
  formatYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatchMarkdown.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('youtube upload batch markdown formatter', () => {
  it('returns NO_VIDEOS when the payload is empty or has no videos', () => {
    expect(formatYoutubeUploadBatchMarkdown()).toBe(EMPTY_RESPONSE);
    expect(formatYoutubeUploadBatchMarkdown({})).toBe(EMPTY_RESPONSE);
    expect(
      formatYoutubeUploadBatchMarkdown({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [],
      })
    ).toBe(EMPTY_RESPONSE);
  });

  it('formats each video as markdown with the required sections', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'ignored',
        },
        {
          video_id: 'fallback-id',
          job: 'ignored',
        },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain(
      '1) URL\nhttps://www.youtube.com/watch?v=fallback-id'
    );
    expect(markdown.match(/2\) Copy LinkedIn empresa/g)).toHaveLength(2);
    expect(markdown.match(/3\) Caption Instagram/g)).toHaveLength(2);
  });

  it('keeps social copy within limits and required wording', () => {
    expect(LINKEDIN_COPY.length).toBeLessThanOrEqual(900);
    expect(INSTAGRAM_CAPTION.length).toBeLessThanOrEqual(500);

    expect(LINKEDIN_COPY).toContain('magnoterra.cl/contacto');
    expect(LINKEDIN_COPY).toContain('#PuestaATierra');
    expect(LINKEDIN_COPY).toContain('#Chile');
    expect(LINKEDIN_COPY).toContain('#MagnoTerra');
    expect(LINKEDIN_COPY).toContain('RIC N06');
    expect(LINKEDIN_COPY).toContain('segun las condiciones de cada proyecto');

    const forbiddenPattern = /(ohm|omega|Ω|SEC|cert SEC)/i;
    expect(forbiddenPattern.test(LINKEDIN_COPY)).toBe(false);
    expect(forbiddenPattern.test(INSTAGRAM_CAPTION)).toBe(false);
  });
});

describe('youtube upload batch webhook route', () => {
  it('responds with text markdown for valid webhook payloads', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'ignored',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('responds NO_VIDEOS as markdown for empty payloads', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe(EMPTY_RESPONSE);
  });
});
