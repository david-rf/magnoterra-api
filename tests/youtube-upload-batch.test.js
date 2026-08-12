import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  CONTACT_URL,
  REQUIRED_HASHTAGS,
  generateYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const linkedinCopyFrom = (markdown) => {
  const match = markdown.match(/2\) Copy LinkedIn empresa:\n([\s\S]*?)\n3\) Caption Instagram:/);
  return match?.[1] ?? '';
};

const instagramCaptionFrom = (markdown) => {
  const match = markdown.match(/3\) Caption Instagram:\n([\s\S]*?)(?:\n\n##|$)/);
  return match?.[1] ?? '';
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS for an empty payload', () => {
    expect(generateYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })).toBe('NO_VIDEOS');
    expect(generateYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('generates markdown with required social copy fields', () => {
    const markdown = generateYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example',
          job: {
            title: 'Medicion de puesta a tierra industrial',
            location: 'Santiago',
          },
        },
      ],
    });

    const linkedinCopy = linkedinCopyFrom(markdown);
    const instagramCaption = instagramCaptionFrom(markdown);

    expect(markdown).toContain('## yt-001');
    expect(markdown).toContain('1) URL: https://youtu.be/example');
    expect(markdown).toContain('2) Copy LinkedIn empresa:');
    expect(markdown).toContain('3) Caption Instagram:');
    expect(linkedinCopy).toContain(CONTACT_URL);
    expect(linkedinCopy).toContain(REQUIRED_HASHTAGS);
    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('avoids disallowed claims and conditions RIC N06 references', () => {
    const markdown = generateYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-002',
          url: 'https://youtu.be/riesgo',
          job: 'Caso con 5 Ω, certificado SEC y RIC N° 06 para faena minera',
        },
      ],
    });

    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:Ω|ohm(?:io)?s?|omega)\b/i);
    expect(markdown).not.toMatch(/cert(?:ificado|ificacion)?\.?\s*SEC/i);
    expect(markdown).toContain('RIC N06 cuando aplique al proyecto');
  });

  it('responds from the webhook endpoint as markdown', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });
});
