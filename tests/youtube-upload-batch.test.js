import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../src/routes/index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  normalizeVideoUrl,
} from '../src/social/youtubeUploadBatch.js';

const extractLineValue = (line) => line.replace(/^\d\) [^:]+: /, '');

describe('YouTube upload batch social markdown', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe(
      'NO_VIDEOS',
    );
  });

  it('builds markdown blocks for each video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Instalacion industrial zona centro',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'Mantenimiento preventivo',
        },
      ],
    });

    const blocks = markdown.split('\n\n');

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('1) URL: https://youtu.be/abc123');
    expect(blocks[0]).toContain('2) Copy LinkedIn empresa:');
    expect(blocks[0]).toContain('magnoterra.cl/contacto');
    expect(blocks[0]).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(blocks[0]).toContain('3) Caption Instagram:');
    expect(blocks[1]).toContain('1) URL: https://youtu.be/def456');
  });

  it('keeps LinkedIn and Instagram text within their limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          url: 'https://youtu.be/abc123',
          job: 'Proyecto '.repeat(200),
        },
      ],
    });

    const [, linkedInLine, instagramLine] = markdown.split('\n');
    const linkedInCopy = extractLineValue(linkedInLine);
    const instagramCaption = extractLineValue(instagramLine);

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('removes prohibited terms from job content before composing copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          url: 'https://youtu.be/abc123',
          job: 'Medicion 3.2 ohms con certificacion SEC bajo RIC N06 y Omega',
        },
      ],
    });

    expect(markdown).not.toMatch(/omega|ohm|SEC|certificacion|RIC\s*N\s*0?6|Ω/i);
  });

  it('falls back to a YouTube URL when only video_id is present', () => {
    expect(normalizeVideoUrl({ video_id: 'abc 123' })).toBe(
      'https://www.youtube.com/watch?v=abc%20123',
    );
  });

  it('serves the webhook response as markdown from the API route', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ url: 'https://youtu.be/abc123', job: 'Proyecto minero norte' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
  });
});
