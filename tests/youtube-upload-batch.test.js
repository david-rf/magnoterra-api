import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  NO_VIDEOS,
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatchMarkdown.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown({})).toBe(NO_VIDEOS);
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe(NO_VIDEOS);
  });

  it('formats each uploaded video as markdown only', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Instalacion de puesta a tierra para industria',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'Revision preventiva en terreno',
        },
      ],
    });

    expect(markdown).toContain('## Video 1');
    expect(markdown).toContain('## Video 2');
    expect(markdown).toContain('1. URL: https://youtu.be/abc123');
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
  });

  it('keeps LinkedIn and Instagram text within requested limits', () => {
    const video = {
      job: 'Diagnostico tecnico '.repeat(80),
      url: 'https://youtu.be/limit',
    };

    expect(buildLinkedInCopy(video).length).toBeLessThanOrEqual(
      LINKEDIN_LIMIT
    );
    expect(buildInstagramCaption(video).length).toBeLessThanOrEqual(
      INSTAGRAM_LIMIT
    );
  });

  it('includes required LinkedIn CTA and hashtags', () => {
    const copy = buildLinkedInCopy({
      job: 'Mejoramiento de sistema de puesta a tierra',
    });

    expect(copy).toContain('magnoterra.cl/contacto');
    expect(copy).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('sanitizes omega figures and SEC certificate claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'safe123',
          job: 'Malla 2 \u03a9 con cert SEC y RIC N06 obligatorio',
        },
      ],
    });

    expect(markdown).not.toMatch(/[\u03a9\u2126]/);
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm|omega)s?\b/i);
    expect(markdown).toContain(
      'criterios RIC N06 cuando corresponda al proyecto'
    );
  });

  it('derives the video URL from video_id when url is missing', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'abc 123', job: 'Registro en terreno' }],
    });

    expect(markdown).toContain(
      '1. URL: https://www.youtube.com/watch?v=abc%20123'
    );
  });
});

describe('youtube upload batch route', () => {
  it('responds with markdown text', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'route123',
            url: 'https://youtu.be/route123',
            job: 'Instalacion en terreno',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://youtu.be/route123');
    expect(response.text).toContain('magnoterra.cl/contacto');
  });
});
