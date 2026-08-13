import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadBatch.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

const extractSection = (markdown, title) => {
  const start = markdown.indexOf(`${title}\n`);
  if (start === -1) {
    return '';
  }

  const section = markdown.slice(start + title.length + 1);
  const nextHeading = section.search(/\n\n\d\) /);
  return (nextHeading === -1 ? section : section.slice(0, nextHeading)).trim();
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [],
    })).toBe('NO_VIDEOS');
  });

  it('builds one markdown block per video with required social copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/example',
          job: 'Mantencion para industria en Santiago',
        },
      ],
    });

    const linkedinCopy = extractSection(markdown, '2) Copy LinkedIn empresa');
    const instagramCaption = extractSection(markdown, '3) Caption Instagram');

    expect(markdown).toContain('### Video abc123');
    expect(markdown).toContain('1) URL\nhttps://youtu.be/example');
    expect(linkedinCopy).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('removes disallowed measurement, certification, and RIC N06 claims from job text', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'secure',
          url: 'https://www.youtube.com/watch?v=secure',
          job: 'Medicion 0.8 ohm certificado SEC RIC N06 para planta norte',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b(?:ohm|ohms|omega)\b/i);
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\bRIC\s*N\s*0?6\b/i);
    expect(markdown).toContain('planta norte');
  });

  it('responds with text markdown from the webhook route', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'video-1',
            url: 'https://youtu.be/video-1',
            job: 'Proyecto industrial',
          },
          {
            video_id: 'video-2',
            url: 'https://youtu.be/video-2',
            job: 'Faena minera',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('### Video video-1');
    expect(response.text).toContain('---');
    expect(response.text).toContain('### Video video-2');
  });
});
