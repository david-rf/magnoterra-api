import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  EMPTY_VIDEOS_RESPONSE,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const extractLinkedInCopy = (markdown) => markdown
  .match(/2\) Copy LinkedIn empresa \(<=900 chars\):\n([\s\S]*?)\n\n3\) Caption Instagram/)?.[1];

const extractInstagramCaption = (markdown) => markdown
  .match(/3\) Caption Instagram \(<=500 chars\):\n([\s\S]*?)(?:\n\n### Video|$)/)?.[1];

describe('YouTube upload batch social markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(renderYoutubeUploadBatchMarkdown()).toBe(EMPTY_VIDEOS_RESPONSE);
    expect(renderYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] }))
      .toBe(EMPTY_VIDEOS_RESPONSE);
  });

  it('renders one markdown block per video with safe social copy', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example',
          job: {
            title: 'Resistencia 5 Omega, cert SEC y RIC N06 obligatorio para obra industrial',
          },
        },
      ],
    });

    const linkedInCopy = extractLinkedInCopy(markdown);
    const instagramCaption = extractInstagramCaption(markdown);

    expect(markdown).toContain('### Video yt-001');
    expect(markdown).toContain('1) URL: https://youtu.be/example');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toMatch(/\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:io)?s?)/i);
    expect(markdown).not.toMatch(/\bSEC\b/);
    expect(markdown).toContain('RIC N06 deben revisarse segun el alcance');
    expect(linkedInCopy).toBeDefined();
    expect(instagramCaption).toBeDefined();
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('exposes the formatter as a markdown webhook endpoint', async () => {
    const payload = {
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-002',
          url: 'https://www.youtube.com/watch?v=example',
          job: 'Instalacion de puesta a tierra para faena minera',
        },
      ],
    };

    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe(renderYoutubeUploadBatchMarkdown(payload));
  });
});
