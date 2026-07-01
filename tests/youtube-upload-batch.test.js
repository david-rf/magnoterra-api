import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  LINKEDIN_COPY,
  INSTAGRAM_CAPTION,
  NO_VIDEOS_RESPONSE,
} from '../src/social/youtubeUploadBatch.js';

const forbiddenClaims = /(omega|ohm|ohmio|\u03a9|cert\s*SEC|certificacion\s*SEC)/i;

describe('YouTube upload batch webhook', () => {
  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'video-post',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'video-post',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://youtu.be/abc123');
    expect(response.text).toContain('1. URL: https://youtu.be/def456');
    expect(response.text).toContain('2. Copy LinkedIn empresa:');
    expect(response.text).toContain('3. Caption Instagram:');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).not.toMatch(forbiddenClaims);
  });

  it('keeps channel copy within requested character limits', () => {
    expect(LINKEDIN_COPY.length).toBeLessThanOrEqual(900);
    expect(INSTAGRAM_CAPTION.length).toBeLessThanOrEqual(500);
    expect(LINKEDIN_COPY).not.toMatch(forbiddenClaims);
    expect(INSTAGRAM_CAPTION).not.toMatch(forbiddenClaims);
    expect(LINKEDIN_COPY).toContain('RIC N06');
    expect(INSTAGRAM_CAPTION).toContain('RIC N06');
  });

  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });

  it('returns NO_VIDEOS when there are no usable video URLs', () => {
    expect(buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'abc123', url: '', job: 'video-post' }],
    })).toBe(NO_VIDEOS_RESPONSE);
  });
});
