import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildInstagramCaption,
  buildLinkedInCompanyCopy,
  buildYoutubeUploadBatchMarkdown,
  CONTACT_CTA,
  REQUIRED_HASHTAGS,
} from '../src/social/youtubeUploadBatch.js';

const forbiddenClaimsPattern = /(?:omega|ohmios?|ohms?|Ω|\bSEC\b|cert(?:ificacion|ificado)?\s+SEC)/i;

describe('YouTube upload batch webhook', () => {
  it('responds with markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Proyecto zona norte',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toContain('1. URL: https://youtu.be/abc123');
    expect(response.text).toContain('2. Copy LinkedIn empresa (<=900 chars):');
    expect(response.text).toContain('3. Caption Instagram (<=500 chars):');
    expect(response.text).toContain(CONTACT_CTA);
    expect(response.text).toContain(REQUIRED_HASHTAGS);
    expect(response.text).toContain('RIC N06 se considera siempre condicionado al proyecto');
    expect(response.text).not.toMatch(forbiddenClaimsPattern);
  });

  it('responds NO_VIDEOS when the payload has no usable videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ job: 'sin url ni video id' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/markdown/);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('supports direct webhook path and derives a URL from video_id', async () => {
    const response = await request(app)
      .post('/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'direct-id' }],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1. URL: https://www.youtube.com/watch?v=direct-id');
  });

  it('keeps social copy within requested limits and rules', () => {
    const linkedInCopy = buildLinkedInCompanyCopy();
    const instagramCaption = buildInstagramCaption();

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(linkedInCopy).toContain(CONTACT_CTA);
    expect(linkedInCopy).toContain(REQUIRED_HASHTAGS);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).not.toMatch(forbiddenClaimsPattern);
    expect(instagramCaption).not.toMatch(forbiddenClaimsPattern);
  });

  it('returns NO_VIDEOS for empty payloads', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({ videos: [] })).toBe('NO_VIDEOS');
  });
});
