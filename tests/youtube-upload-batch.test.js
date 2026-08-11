import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  INSTAGRAM_LIMIT,
  LINKEDIN_HASHTAGS,
  LINKEDIN_LIMIT,
  buildYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatchMarkdown.js';

function extractBetween(markdown, startMarker, endMarker) {
  const [, section = ''] = markdown.split(startMarker);
  const [value = ''] = section.split(endMarker);

  return value.trim();
}

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(buildYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });

  it('builds one markdown block per video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'instalacion industrial de puesta a tierra',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'mantencion preventiva',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('1) URL: https://youtu.be/def456');
    expect(markdown.match(/Copy LinkedIn empresa/g)).toHaveLength(2);
    expect(markdown.match(/Caption Instagram/g)).toHaveLength(2);
  });

  it('keeps channel copy inside length limits and required LinkedIn CTA/hashtags', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'revision tecnica de mallas y continuidad operacional',
        },
      ],
    });
    const linkedInCopy = extractBetween(markdown, '2) Copy LinkedIn empresa:', '3) Caption Instagram:');
    const instagramCaption = markdown.split('3) Caption Instagram:')[1].trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_LIMIT);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain(LINKEDIN_HASHTAGS);
  });

  it('removes restricted claims from job text', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'certificacion SEC con 5 Ohm y cumplimiento RIC N06 garantizado',
        },
      ],
    });

    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm|ohms|ohmios|omega)\b/i);
    expect(markdown).toContain('la aplicacion de RIC N06 se confirma segun el proyecto');
  });
});

describe('POST /api/webhooks/youtube-upload-batch', () => {
  it('responds with markdown only for youtube_upload_batch videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'instalacion para industria',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).not.toContain('{');
  });

  it('responds NO_VIDEOS when no videos are provided', async () => {
    const response = await request(app).post('/api/webhooks/youtube-upload-batch').send({
      event: 'youtube_upload_batch',
      videos: [],
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
