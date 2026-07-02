import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatchMarkdown.js';
import { youtubeUploadBatchWebhook } from '../src/webhooks/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/webhooks/youtube-upload-batch', youtubeUploadBatchWebhook);
  return app;
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(
      buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })
    ).toBe('NO_VIDEOS');
  });

  it('formats one markdown block per video with required copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: {
            title: 'Malla de puesta a tierra industrial',
            location: 'Antofagasta',
          },
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://youtu.be/abc123');
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps social copy within platform limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/limits',
          job: {
            title: 'Proyecto '.repeat(80),
            description: 'Descripcion '.repeat(120),
          },
        },
      ],
    });

    const linkedIn = markdown.match(
      /2\. Copy LinkedIn empresa: (?<copy>[\s\S]*?)\n\n3\./
    ).groups.copy;
    const instagram = markdown.match(/3\. Caption Instagram: (?<copy>[\s\S]*)/)
      .groups.copy;

    expect(linkedIn.length).toBeLessThanOrEqual(900);
    expect(instagram.length).toBeLessThanOrEqual(500);
  });

  it('removes disallowed technical claims from job context', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/rules',
          job: {
            title: 'Medicion <1 Ohm con cert SEC',
            description: 'Aplicacion RIC N06',
          },
        },
      ],
    });

    expect(markdown).not.toMatch(
      /\d+(?:[.,]\d+)?\s*(?:ohm|ohmios|[\u03a9\u2126])/i
    );
    expect(markdown).not.toMatch(
      /cert(?:ificado|ificacion|ificaci\u00f3n)?\.?\s*SEC/i
    );
    expect(markdown).toMatch(
      /RIC N06 .*proyecto|RIC N06 .*alcance del proyecto/
    );
  });

  it('responds with markdown from the webhook endpoint', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'fallback-id', job: 'Revision tecnica' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain(
      'https://www.youtube.com/watch?v=fallback-id'
    );
  });
});
