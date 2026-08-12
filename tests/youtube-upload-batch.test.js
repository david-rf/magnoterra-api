import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  formatYoutubeUploadBatchMarkdown,
  NO_VIDEOS_RESPONSE,
} from '../src/social/youtubeUploadBatch.js';

const validPayload = {
  event: 'youtube_upload_batch',
  videos: [
    {
      video_id: 'yt-001',
      url: 'https://www.youtube.com/watch?v=abc123',
      job: 'demo',
    },
  ],
};

const valueAfterLabel = (line) => line.split(': ').slice(1).join(': ');

describe('youtube_upload_batch markdown formatter', () => {
  it('returns NO_VIDEOS when videos are missing or empty', () => {
    expect(formatYoutubeUploadBatchMarkdown()).toBe(NO_VIDEOS_RESPONSE);
    expect(formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe(NO_VIDEOS_RESPONSE);
  });

  it('formats one markdown block per video with required copy limits', () => {
    const markdown = formatYoutubeUploadBatchMarkdown(validPayload);
    const [urlLine, linkedInLine, instagramLine] = markdown.split('\n');
    const linkedInCopy = valueAfterLabel(linkedInLine);
    const instagramCaption = valueAfterLabel(instagramLine);

    expect(urlLine).toBe('1) URL: https://www.youtube.com/watch?v=abc123');
    expect(linkedInLine).toContain('2) Copy LinkedIn empresa: ');
    expect(instagramLine).toContain('3) Caption Instagram: ');
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toMatch(/omega|ohm|cert\s*SEC|Ω/i);
    expect(markdown).toContain('RIC N06 segun las condiciones');
  });
});

describe('POST /api/webhooks youtube_upload_batch', () => {
  it('responds with text/markdown for youtube upload batches', async () => {
    const response = await request(app).post('/api/webhooks').send(validPayload);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://www.youtube.com/watch?v=abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa: ');
    expect(response.text).toContain('3) Caption Instagram: ');
  });

  it('responds NO_VIDEOS for empty payloads', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });
});
