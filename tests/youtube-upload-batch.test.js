import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../index.js';
import {
  CTA_URL,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
  createSocialCopyForVideo,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const extractLinkedInCopy = (markdown) =>
  markdown.match(/^2\) Copy LinkedIn empresa: (.+)$/m)?.[1] ?? '';

const extractInstagramCaption = (markdown) =>
  markdown.match(/^3\) Caption Instagram: (.+)$/m)?.[1] ?? '';

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when payload is empty or has no videos', () => {
    expect(renderYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(renderYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(
      renderYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
  });

  it('renders markdown blocks for each valid video', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Obra industrial norte',
        },
        {
          video_id: 'def456',
          url: 'https://youtube.com/watch?v=def456',
          job: 'Proyecto minero',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('1) URL: https://youtube.com/watch?v=def456');

    const linkedinCopies = markdown.match(/^2\) Copy LinkedIn empresa: .+$/gm);
    const instagramCaptions = markdown.match(/^3\) Caption Instagram: .+$/gm);

    expect(linkedinCopies).toHaveLength(2);
    expect(instagramCaptions).toHaveLength(2);
  });

  it('keeps LinkedIn copy within constraints and required CTA/hashtags', () => {
    const copy = createSocialCopyForVideo({
      url: 'https://youtu.be/abc123',
      job: 'Mantenimiento preventivo',
    });

    expect(copy.linkedin.length).toBeLessThanOrEqual(LINKEDIN_MAX_LENGTH);
    expect(copy.linkedin).toContain(CTA_URL);
    expect(copy.linkedin).toContain(REQUIRED_HASHTAGS);
    expect(copy.linkedin).toContain('RIC N06 queda condicionada');
  });

  it('keeps Instagram captions within the requested length', () => {
    const copy = createSocialCopyForVideo({
      url: 'https://youtu.be/abc123',
      job: 'x'.repeat(500),
    });

    expect(copy.instagram.length).toBeLessThanOrEqual(INSTAGRAM_MAX_LENGTH);
  });

  it('omits invalid videos and restricted external terms from generated copy', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'invalid',
          url: 'javascript:alert(1)',
          job: 'No debe salir',
        },
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Medicion 5 Ohm con certificado SEC y RIC N06 inmediato',
        },
      ],
    });

    const linkedin = extractLinkedInCopy(markdown);
    const instagram = extractInstagramCaption(markdown);

    expect(markdown).not.toContain('javascript:alert');
    expect(linkedin).not.toMatch(
      /\b\d+(?:[,.]\d+)?\s*(ohms?|ohmios?|omega)\b/i
    );
    expect(linkedin).not.toMatch(/\bSEC\b/i);
    expect(instagram).not.toMatch(/\bSEC\b/i);
    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
  });
});

describe('YouTube upload batch webhook endpoint', () => {
  it('returns markdown from POST /api/webhooks/youtube', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Obra industrial norte',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).toContain(CTA_URL);
  });

  it('returns NO_VIDEOS when the webhook payload is empty', async () => {
    const response = await request(app).post('/api/webhooks/youtube').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });
});
