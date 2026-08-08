import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  formatVideoSocialMarkdown,
  formatYoutubeUploadBatchMarkdown,
  NO_VIDEOS,
} from '../src/social/youtubeUploadBatch.js';

const extractLinkedinCopy = (markdown) =>
  markdown
    .match(/2\. Copy LinkedIn empresa: ([\s\S]*?)\n3\. Caption Instagram:/)[1]
    .trim();

const extractInstagramCaption = (markdown) =>
  markdown.match(/3\. Caption Instagram: ([\s\S]*)$/)[1].trim();

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(formatYoutubeUploadBatchMarkdown({})).toBe(NO_VIDEOS);
    expect(formatYoutubeUploadBatchMarkdown({ videos: [] })).toBe(NO_VIDEOS);
  });

  it('formats each video as markdown with URL, LinkedIn copy, and Instagram caption', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Inspeccion de malla para planta industrial',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: { title: 'Mantencion preventiva en terreno' },
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://youtu.be/abc123');
    expect(markdown).toContain('1. URL: https://youtu.be/def456');
    expect(markdown).toContain('2. Copy LinkedIn empresa:');
    expect(markdown).toContain('3. Caption Instagram:');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('keeps copy within channel limits and avoids prohibited claims', () => {
    const markdown = formatVideoSocialMarkdown({
      url: 'https://youtu.be/ghi789',
      job: 'Certificacion SEC con 5 Ohm y 10 Ω para proyecto minero Omega',
    });

    const linkedinCopy = extractLinkedinCopy(markdown);
    const instagramCaption = extractInstagramCaption(markdown);

    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedinCopy).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06');
    expect(markdown).toMatch(/corresponde al proyecto/);
    expect(markdown).not.toMatch(/(?:SEC|Ω|omega|ohm|certificacion SEC)/i);
  });

  it('responds with text markdown from the webhook endpoint', async () => {
    const app = express();

    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe(NO_VIDEOS);
  });
});
