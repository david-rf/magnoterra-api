import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  formatYoutubeUploadBatchMarkdown,
  limits,
  templates,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(formatYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
  });

  it('formats one markdown block per video URL', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'puesta a tierra',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: 'mantencion',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('https://youtu.be/abc123');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('https://youtu.be/def456');
  });

  it('uses the video id as a fallback URL', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'abc 123', job: 'puesta a tierra' }],
    });

    expect(markdown).toContain('https://www.youtube.com/watch?v=abc%20123');
  });

  it('keeps copy within channel limits and required wording', () => {
    expect(templates.linkedInCopy.length).toBeLessThanOrEqual(
      limits.linkedInMaxLength
    );
    expect(templates.instagramCaption.length).toBeLessThanOrEqual(
      limits.instagramMaxLength
    );

    for (const copy of [templates.linkedInCopy, templates.instagramCaption]) {
      expect(copy).toContain('magnoterra.cl/contacto');
      expect(copy).toContain('#PuestaATierra #Chile #MagnoTerra');
      expect(copy).toContain('RIC N06 se revisa segun corresponda al proyecto');
      expect(copy).not.toMatch(/omega|ohm|Ω/i);
      expect(copy).not.toMatch(/\bSEC\b/);
    }
  });

  it('responds with markdown from the generic webhook endpoint', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('responds NO_VIDEOS for an empty webhook payload', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });
});
