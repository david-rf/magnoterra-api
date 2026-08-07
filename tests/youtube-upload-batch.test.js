import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
  sanitizeJobText,
} from '../src/social/youtubeUploadBatch.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });

  it('builds only markdown sections for every video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtube.com/watch?v=abc123',
          job: 'Instalacion de malla de puesta a tierra para faena minera',
        },
        {
          video_id: 'def456',
          url: 'https://youtube.com/watch?v=def456',
          job: { title: 'Inspeccion tecnica de electrodos' },
        },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtube.com/watch?v=abc123');
    expect(markdown).toContain('1) URL\nhttps://youtube.com/watch?v=def456');
    expect(markdown.match(/2\) Copy LinkedIn empresa/g)).toHaveLength(2);
    expect(markdown.match(/3\) Caption Instagram/g)).toHaveLength(2);
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('removes restricted claims and conditionalizes RIC N06 references', () => {
    const job =
      'Certificacion SEC con RIC N06 y medicion bajo 5 ohm en terreno';
    const linkedin = buildLinkedInCopy(job);
    const instagram = buildInstagramCaption(job);
    const combined = `${sanitizeJobText(job)} ${linkedin} ${instagram}`;

    expect(combined).not.toMatch(/\bSEC\b/i);
    expect(combined).not.toMatch(/\d+(?:[.,]\d+)?\s*(?:ohm|omega)/i);
    expect(combined).not.toMatch(/\d+(?:[.,]\d+)?\s*[\u03a9\u2126\u03c9]/i);
    expect(combined).toContain('normativa aplicable segun el proyecto');
  });

  it('keeps LinkedIn and Instagram text within requested limits', () => {
    const longJob = `Proyecto ${'muy '.repeat(300)}extenso`;

    expect(buildLinkedInCopy(longJob).length).toBeLessThanOrEqual(900);
    expect(buildInstagramCaption(longJob).length).toBeLessThanOrEqual(500);
  });

  it('responds with markdown for youtube_upload_batch webhooks', async () => {
    const response = await request(createApp())
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtube.com/watch?v=abc123',
            job: 'Revision de camara de inspeccion para puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('1) URL');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('responds NO_VIDEOS when the batch has no videos', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
