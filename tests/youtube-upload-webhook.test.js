import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import webhookRoutes from '../src/routes/webhooks.js';
import {
  formatYoutubeUploadBatchMarkdown,
  getInstagramCaption,
  getLinkedinCopy,
  NO_VIDEOS_RESPONSE,
  YOUTUBE_UPLOAD_BATCH_EVENT,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', webhookRoutes);

  return app;
};

const getFirstLinkedinCopy = (markdown) =>
  markdown.match(/2\) Copy LinkedIn empresa: ([\s\S]*?)\n3\) Caption/)?.[1];

const getFirstInstagramCaption = (markdown) =>
  markdown.match(/3\) Caption Instagram: ([^\n]+)/)?.[1];

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(createApp()).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });

  it('returns markdown posts for every uploaded video', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'instalacion puesta a tierra',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'mantencion industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toContain('## Video 1');
    expect(response.text).toContain('## Video 2');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).toContain('1) URL: https://youtu.be/def456');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
  });

  it('keeps social copy within requested limits and required wording', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [{ video_id: 'abc123', job: 'diagnostico' }],
    });

    const linkedinCopy = getFirstLinkedinCopy(markdown);
    const instagramCaption = getFirstInstagramCaption(markdown);

    expect(markdown).toContain(
      '1) URL: https://www.youtube.com/watch?v=abc123'
    );
    expect(linkedinCopy).toBeDefined();
    expect(instagramCaption).toBeDefined();
    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedinCopy).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedinCopy).toContain('RIC N06');
    expect(instagramCaption).toContain('RIC N06');
  });

  it('does not include forbidden Omega figures or SEC certification wording', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: '5 ohm certificacion SEC',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(ohm|omega)\b/i);
    expect(markdown).not.toMatch(/cert(?:ificado|ificacion)?\s+SEC/i);
  });

  it('exports copy constants that satisfy character limits', () => {
    expect(getLinkedinCopy().length).toBeLessThanOrEqual(900);
    expect(getInstagramCaption().length).toBeLessThanOrEqual(500);
  });
});
