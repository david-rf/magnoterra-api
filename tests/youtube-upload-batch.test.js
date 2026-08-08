import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  generateYoutubeUploadBatchMarkdown,
  socialCopyLimits,
} from '../src/lib/youtubeSocialMarkdown.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

const extractLineValue = (line) => line.replace(/^\d\) [^:]+: /, '');

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns one markdown block per valid video URL', async () => {
    const response = await request(createApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'medicion 0.5 ohm con cert SEC',
          },
          {
            video_id: 'def456',
            url: 'https://www.youtube.com/watch?v=def456',
            job: 'mantenimiento industrial',
          },
        ],
      });

    const blocks = response.text.split('\n\n');

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('1) URL: https://youtu.be/abc123');
    expect(blocks[1]).toContain('1) URL: https://www.youtube.com/watch?v=def456');
    expect(response.text).not.toMatch(/\b(?:ohm|omega|SEC)\b|cert/i);
  });

  it('keeps LinkedIn and Instagram copy within requested limits', () => {
    const markdown = generateYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'puesta a tierra',
        },
      ],
    });
    const [, linkedinLine, instagramLine] = markdown.split('\n');
    const linkedinCopy = extractLineValue(linkedinLine);
    const instagramCaption = extractLineValue(instagramLine);

    expect(linkedinCopy.length).toBeLessThanOrEqual(socialCopyLimits.linkedin);
    expect(instagramCaption.length).toBeLessThanOrEqual(socialCopyLimits.instagram);
    expect(linkedinCopy).toContain('https://magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedinCopy).toContain('RIC N06');
    expect(instagramCaption).toContain('RIC N06');
  });

  it('returns NO_VIDEOS when all video URLs are missing or invalid', () => {
    const markdown = generateYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        { video_id: 'abc123', url: 'not-a-url', job: 'puesta a tierra' },
        { video_id: 'def456', job: 'puesta a tierra' },
      ],
    });

    expect(markdown).toBe('NO_VIDEOS');
  });
});
